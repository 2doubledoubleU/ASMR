#!/usr/bin/python3
# -*- coding: UTF-8 -*-

import sqlite3
import cgi
import feedparser
import re
import time
import datetime

def get_image(source): 
	ffs = re.search('src="(http(s)?://.*?)"', source.summary)
	if "media_thumbnail" in source:
		return source["media_thumbnail"][0]["url"]
	elif "media_content" in source:
		return source["media_content"][0]["url"]
	elif ffs:
		return ffs.group(1)
	else:
		return "noImage.png"
		#add proper image for when feed has no image

def get_time(source):
	if "published_parsed" in source:
		# logging comment to remove return 
		#time.strftime('%Y-%m-%dT%H:%M:%SZ', article['published_parsed'])
		return datetime.datetime.utcnow().isoformat()+"Z"
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

while True:

	db.execute('SELECT * from feeds')

	for feed in db.fetchall():
	    feed_results = feedparser.parse(feed[2])
	    #logging
	    #print(feed[0])
	    for article in feed_results['entries']:
	    	if ('id' in article):
	    		article_id = (article['id'])
	    	else:
	    		article_id = article['link']
	    	db.execute('SELECT count(*) from article_entries WHERE uid=?', [article_id])
	    	if (not db.fetchone()[0]) and ('link' in article):
	        	print(article['title'])
	        	image_link = get_image(article)
	        	times = get_time(article)
	        	db.executemany('INSERT INTO article_entries VALUES (?,?,?,?,?,?,?,?)', [(article_id,article['title'],feed[1],feed[0],article['link'],image_link,times,0)])
	        	#logging
	        	#print("added article", article['title'], "to category", feed[1])
	db_connection.commit()
	print("commit")
	time.sleep(300)
	print("going again")

#This entire thing works but could do with polish and then needs daemonising