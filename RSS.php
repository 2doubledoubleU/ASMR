<?php
$var1 = $_POST;

$PDO = new PDO('sqlite:/var/www/html/RSS/RSS.sqlite');

switch($var1[0]) {
	case 1:
		if ($var1[1] == 1) {
			$sth = $PDO->prepare('SELECT category, count(uid) as amount FROM article_entries WHERE feed_id IN (SELECT feed_id from feeds where valid = 1) GROUP BY category');
		} else {
			$sth = $PDO->prepare('SELECT category, count(uid) as amount FROM article_entries where read="0" AND feed_id IN (SELECT feed_id from feeds where valid = 1) GROUP BY category');
		}
		break;
	case 2:
		if ($var1[1] == 1) {
			$sth = $PDO->prepare('SELECT feed, category, count(uid) as amount FROM article_entries WHERE feed_id IN (SELECT feed_id from feeds where valid = 1) GROUP BY feed, category');
		} else {
			$sth = $PDO->prepare('SELECT feed, category, count(uid) as amount FROM article_entries where read="0" AND feed_id IN (SELECT feed_id from feeds where valid = 1)  GROUP BY feed, category');
		}
		break;
	case 3:
		if ($var1[1] == 1) {
			if (empty($var1[2])) {
				$sth = $PDO->prepare('SELECT * FROM article_entries WHERE feed_id IN (SELECT feed_id from feeds where valid = 1) order by added DESC');
			} elseif (empty($var1[3])) {
				$sth = $PDO->prepare('SELECT * FROM article_entries where category=? and feed_id IN (SELECT feed_id from feeds where valid = 1) order by added DESC');
				$sth->bindParam(1, $var1[2], PDO::PARAM_STR);
			} else {
				$sth = $PDO->prepare('SELECT * FROM article_entries where feed=? and category=? and feed_id IN (SELECT feed_id from feeds where valid = 1) order by added DESC');
				$sth->bindParam(1, $var1[3], PDO::PARAM_STR);
				$sth->bindParam(2, $var1[2], PDO::PARAM_STR);
			}
		} else {
			if (empty($var1[2])) {
				$sth = $PDO->prepare('SELECT * FROM article_entries where read="0" and feed_id IN (SELECT feed_id from feeds where valid = 1) order by added DESC');
			} elseif (empty($var1[3])) {
				$sth = $PDO->prepare('SELECT * FROM article_entries where read="0" and feed_id IN (SELECT feed_id from feeds where valid = 1) and category=? order by added DESC');
				$sth->bindParam(1, $var1[2], PDO::PARAM_STR);
			} else {
				$sth = $PDO->prepare('SELECT * FROM article_entries where read="0" and feed_id IN (SELECT feed_id from feeds where valid = 1) and feed=? order by added DESC');
				$sth->bindParam(1, $var1[3], PDO::PARAM_STR);
			}
		}
		break;
	case 4:
		$sth = $PDO->prepare('UPDATE article_entries SET read=? WHERE link=?');
		$sth->bindParam(1, $var1[2], PDO::PARAM_STR);
		$sth->bindParam(2, $var1[1], PDO::PARAM_STR);
		break;
	case 5:
		if (empty($var1[1])) {
			$sth = $PDO->prepare('UPDATE article_entries SET read=1 where added <=?');
			$sth->bindParam(1, $var1[3], PDO::PARAM_STR);
		} elseif (empty($var1[2])) {
			$sth = $PDO->prepare('UPDATE article_entries SET read=1 where category=? and added <=?');
			$sth->bindParam(1, $var1[1], PDO::PARAM_STR);
			$sth->bindParam(2, $var1[3], PDO::PARAM_STR);
		} else {
			$sth = $PDO->prepare('UPDATE article_entries SET read=1 where feed=? and added <=?');
			$sth->bindParam(1, $var1[2], PDO::PARAM_STR);
			$sth->bindParam(2, $var1[3], PDO::PARAM_STR);
		}
		break;
	case 6:
		$sth = $PDO->prepare('SELECT feed_name, category, feed FROM feeds WHERE valid = 1 ORDER BY feed_name');
		break;
	case 7:
		$sth = $PDO->prepare('UPDATE feeds SET valid = 0 where feed_name=? and category=? and feed=?');
		$sth->bindParam(1, $var1[1], PDO::PARAM_STR);
		$sth->bindParam(2, $var1[2], PDO::PARAM_STR);
		$sth->bindParam(3, $var1[3], PDO::PARAM_STR);
		break;
	case 8:
		$sth = $PDO->prepare('INSERT INTO feeds (feed_name, category, feed, feed_id, valid) VALUES (?,?,?,(SELECT MAX(feed_id) + 1 FROM feeds),1) ');
		$sth->bindParam(1, $var1[1], PDO::PARAM_STR);
		$sth->bindParam(2, $var1[2], PDO::PARAM_STR);
		$sth->bindParam(3, $var1[3], PDO::PARAM_STR);
		break;
}

$sth->execute();
$result = $sth->fetchall(PDO::FETCH_OBJ);

echo json_encode($result);

?>
