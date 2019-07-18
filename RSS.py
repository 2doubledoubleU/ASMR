#!/usr/bin/python3
# -*- coding: UTF-8 -*-

import os
import itertools
import traceback
import sqlite3
import cgi
import feedparser
import re
import time
from datetime import datetime
import html
import multiprocessing
from urllib.request import pathname2url

db_file = 'RSS.sqlite'

def error_print(string):
	print(string)
	with open('error.txt', 'a') as file:
		file.write('[' + time.asctime( time.localtime(time.time())) + '] - ' + string + '\n')

try:
    dburi = 'file:{}?mode=rw'.format(pathname2url(db_file))
    db_connection = sqlite3.connect(dburi, uri=True)
except sqlite3.OperationalError:
    db_connection = sqlite3.connect(db_file)
    error_print('DB RSS.sqlite did not previously exist. Creating DB and proceeding.')
except:
	error_print('An unexpected error occured while attempting to access the DB. This program will now exit.')
	exit(1)

try:
	db = db_connection.cursor()
	db.execute('CREATE TABLE IF NOT EXISTS article_entries (uid TEXT, title TEXT, category TEXT, feed TEXT, link TEXT, image TEXT, added TEXT, read INTEGER, feed_id INTEGER)')
	db.execute('CREATE TABLE IF NOT EXISTS article_read_entries (uid TEXT, title TEXT, category TEXT, feed TEXT, link TEXT, image TEXT, added TEXT, read INTEGER, feed_id INTEGER)')
	db.execute('CREATE TABLE IF NOT EXISTS feeds (feed_name TEXT, category TEXT, feed TEXT, feed_id INTEGER, valid INTEGER)')
	db_connection.commit()
except:
	error_print('An unexpected error occured while checking for tables in the DB. This program will now exit.')
	exit(1)

def get_image(source): 
	#backup = re.search('src="(http(s)?://.*?)"', source.summary)
	try:
		if "media_thumbnail" in source:
			return source["media_thumbnail"][0]["url"]
		elif "media_content" in source:
			return source["media_content"][0]["url"] #fix non images being returned here - do not assume media is image vs mp3 etc
		elif (hasattr(source, 'summary')) and (re.search('src="(http(s)?://.*?)"', source.summary)):
			return html.unescape(re.search('src="(http(s)?://.*?)"', source.summary).group(1))
		else:
			return "noImage.png"
			#to be properly fleshed out once other concerns are taken care of
	except Exception as e:
		with open('error.txt', 'a') as file:
			error_print('Error getting image - ' + traceback.format_exc())


def get_time(source):
	try:
		if "published_parsed" in source:
			return datetime.utcnow().isoformat()+"Z" #extraneous currently, but not yet decided if feeds date should be trusted - remove if not
		else:
			return datetime.utcnow().isoformat()+"Z"
	except Exception as e:
		with open('error.txt', 'a') as file:
			error_print('Error getting time - ' + traceback.format_exc())

def get_article(article):
	try:
		if ('id' in article):
			return (article['id'])
		else:
			return article['link'] #this should be fine unless for some reason links are duplicated (which in an RSS feed lacking IDs could well be the case, but one can only do so much)
	except Exception as e:
		with open('error.txt', 'a') as file:
			error_print('Error getting article - ' + traceback.format_exc())		

#comment for populating blank DB
#records = [('BBC', 'News', 'http://newsrss.bbc.co.uk/rss/newsonline_world_edition/front_page/rss.xml'), ('Ars Technica', 'Technology', 'https://feeds.feedburner.com/arstechnica/index')]
#db.executemany("INSERT INTO feeds VALUES (?,?,?)", records)
#db_connection.commit()

def feeder(feed):
	try:
		feed_results = feedparser.parse(feed[2])
		arrm = []
		for article in feed_results['entries']:
			article_id = get_article(article)
			try:
				db.execute('SELECT (SELECT count(*) from article_entries WHERE uid=?) + (SELECT count(*) from article_read_entries WHERE uid=?)', [article_id,article_id]) 
			except Exception as e:
				with open('error.txt', 'a') as file:
					error_print('Error selecting from DB - ' + traceback.format_exc())
			if (not db.fetchone()[0]) and ('link' in article):
				image_link = get_image(article)
				times = get_time(article)
				arrm.append((article_id,article['title'],feed[1],feed[0],article['link'],image_link,times,0,feed[3]))
		return arrm 		

	except KeyboardInterrupt:
			exit(0)				
	except Exception as e:
		with open('error.txt', 'a') as file:
			error_print('Non specific error in main - ' + traceback.format_exc())

if __name__ == '__main__':
	while True:
		try:
			db.execute('SELECT * from feeds')
			with multiprocessing.Pool(4) as pool:
				po = pool.map(feeder, db, chunksize=4)
			
			po = [x for x in po if x]
			po = list(itertools.chain(*po))

			db.executemany('INSERT into article_entries VALUES (?,?,?,?,?,?,?,?,?)',po)
			db_connection.commit()
			
			db.execute('DELETE from article_entries where feed_id in (SELECT feed_id from feeds where VALID=0)')
			db.execute('DELETE from feeds where valid = 0')
			db_connection.commit()
			
			db.execute('INSERT into article_read_entries SELECT * from article_entries where read=1 and added < DATETIME("now","-30 days")')
			db.execute('DELETE from article_entries where uid in (SELECT uid from article_read_entries)')
			db_connection.commit()
			
		except KeyboardInterrupt:
			error_print('Keyboard Interupt detected. Program exiting.')
			exit(0)
		except:
			error_print('The error function failed while cycling through feeds. ' + traceback.format_exc())
			time.sleep(30)


#partial rewrite - polish and then needs daemonising tbd