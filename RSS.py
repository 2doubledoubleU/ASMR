#!/usr/bin/python3
# -*- coding: UTF-8 -*-

import sqlite3
import cgi
import feedparser
import re
import time
import datetime
import html
import multiprocessing

def get_image(source): 
	backup = re.search('src="(http(s)?://.*?)"', source.summary)
	if "media_thumbnail" in source:
		return source["media_thumbnail"][0]["url"]
	elif "media_content" in source:
		return source["media_content"][0]["url"] #fix non images being returned here - do not assume media is image vs mp3 etc
	elif backup:
		return html.unescape(backup.group(1))
	else:
		return "noImage.png"
		#to be properly fleshed out once other concerns are taken care of

def get_time(source):
	if "published_parsed" in source:
		return datetime.datetime.utcnow().isoformat()+"Z" #extraneous currently, but not yet decided if feeds date should be trusted - remove if not
	else:
		return datetime.datetime.utcnow().isoformat()+"Z"

db_connection = sqlite3.connect('RSS.sqlite')
db = db_connection.cursor()
db.execute('CREATE TABLE IF NOT EXISTS article_entries (uid TEXT, title TEXT, category TEXT, feed TEXT, link TEXT, image TEXT, added TEXT, read INTEGER)')
db.execute('CREATE TABLE IF NOT EXISTS feeds (feed_name TEXT, category TEXT, feed TEXT)')
db_connection.commit()

#comment for populating blank DB
#records = [('BBC', 'News', 'http://newsrss.bbc.co.uk/rss/newsonline_world_edition/front_page/rss.xml'), ('Ars Technica', 'Technology', 'https://feeds.feedburner.com/arstechnica/index')]
#db.executemany("INSERT INTO feeds VALUES (?,?,?)", records)
#db_connection.commit()

def feeder(feed):
	    feed_results = feedparser.parse(feed[2])
	    for article in feed_results['entries']:
	    	if ('id' in article):
	    		article_id = (article['id'])
	    	else:
	    		article_id = article['link'] #this should be fine unless for some reason links are duplicated (which in an RSS feed lacking IDs could well be the case, but one can only do so much)
	    	db.execute('SELECT count(*) from article_entries WHERE uid=?', [article_id]) 
	    	if (not db.fetchone()[0]) and ('link' in article):
	        	image_link = get_image(article)
	        	times = get_time(article)
	        	db.executemany('INSERT INTO article_entries VALUES (?,?,?,?,?,?,?,?)', [(article_id,article['title'],feed[1],feed[0],article['link'],image_link,times,0)])
	        	db_connection.commit() #commit shifted to allow parallelisation and fix (mostly) any DB locking issues

pool = multiprocessing.Pool(4)  #CPU bound on 4 core 
 
while True:
	db.execute('SELECT * from feeds')
	pool.map(feeder, db, chunksize=4) #from testing 3/4 gives best performance
	time.sleep(40)

#partial rewrite - polish and then needs daemonising tbd