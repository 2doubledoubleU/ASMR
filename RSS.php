<?php
$var1 = $_POST;

$PDO = new PDO('sqlite:/var/www/html/RSS/RSS.sqlite');

switch($var1[0]) {
	case 1:
		if ($var1[1] == 1) {
			$sth = $PDO->prepare('SELECT f.category, count(ae.uid) as amount FROM article_entries ae INNER JOIN feeds f ON f.feed_id=ae.feed_id WHERE f.valid = 1 GROUP BY f.category');
		} else {
			$sth = $PDO->prepare('SELECT f.category, count(ae.uid) as amount FROM article_entries ae INNER JOIN feeds f ON f.feed_id=ae.feed_id WHERE f.valid = 1 AND ae.read = 0 GROUP BY f.category');
		}
		break;
	case 2:
		if ($var1[1] == 1) {
			$sth = $PDO->prepare('SELECT f.feed_name, f.category, count(ae.uid) as amount FROM article_entries ae INNER JOIN feeds f ON f.feed_id=ae.feed_id WHERE f.valid = 1 GROUP BY f.feed_name, f.category');
		} else {
			$sth = $PDO->prepare('SELECT f.feed_name, f.category, count(ae.uid) as amount FROM article_entries ae INNER JOIN feeds f ON f.feed_id=ae.feed_id WHERE f.valid = 1 AND ae.read = 0 GROUP BY f.feed_name, f.category');
		}
		break;
	case 3:
		if ($var1[1] == 1) {
			if (empty($var1[2])) {
				$sth = $PDO->prepare('SELECT ae.title, f.feed_name, ae.link, ae.image, ae.added, ae.read FROM article_entries ae INNER JOIN feeds f ON f.feed_id=ae.feed_id WHERE f.valid = 1 order by ae.added DESC');
			} elseif (empty($var1[3])) {
				$sth = $PDO->prepare('SELECT ae.title, f.feed_name, ae.link, ae.image, ae.added, ae.read FROM article_entries ae INNER JOIN feeds f ON f.feed_id=ae.feed_id WHERE f.valid = 1 AND f.category=? order by ae.added DESC');
				$sth->bindParam(1, $var1[2], PDO::PARAM_STR);
			} else {
				$sth = $PDO->prepare('SELECT ae.title, f.feed_name, ae.link, ae.image, ae.added, ae.read FROM article_entries ae INNER JOIN feeds f ON f.feed_id=ae.feed_id WHERE f.valid = 1 AND f.feed_name=? AND f.category=? order by ae.added DESC');
				$sth->bindParam(1, $var1[3], PDO::PARAM_STR);
				$sth->bindParam(2, $var1[2], PDO::PARAM_STR);
			}
		} else {
			if (empty($var1[2])) {
				$sth = $PDO->prepare('SELECT ae.title, f.feed_name, ae.link, ae.image, ae.added, ae.read FROM article_entries ae INNER JOIN feeds f ON f.feed_id=ae.feed_id WHERE f.valid = 1 AND ae.read=0 order by ae.added DESC');
			} elseif (empty($var1[3])) {
				$sth = $PDO->prepare('SELECT ae.title, f.feed_name, ae.link, ae.image, ae.added, ae.read FROM article_entries ae INNER JOIN feeds f ON f.feed_id=ae.feed_id WHERE f.valid = 1 AND f.category=? AND ae.read=0 order by ae.added DESC');
				$sth->bindParam(1, $var1[2], PDO::PARAM_STR);
			} else {
				$sth = $PDO->prepare('SELECT ae.title, f.feed_name, ae.link, ae.image, ae.added, ae.read FROM article_entries ae INNER JOIN feeds f ON f.feed_id=ae.feed_id WHERE f.valid = 1 AND f.feed_name=? AND f.category=? AND ae.read=0 order by ae.added DESC');
				$sth->bindParam(1, $var1[3], PDO::PARAM_STR);
				$sth->bindParam(2, $var1[2], PDO::PARAM_STR);
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
			$sth = $PDO->prepare('UPDATE article_entries SET read=1 where feed_id in (SELECT feed_id from feeds where category=?) AND added <=?');
			$sth->bindParam(1, $var1[1], PDO::PARAM_STR);
			$sth->bindParam(2, $var1[3], PDO::PARAM_STR);
		} else {
			$sth = $PDO->prepare('UPDATE article_entries SET read=1 where feed_id in (SELECT feed_id from feeds where category=? and feed_name=?) AND added <=?');
			$sth->bindParam(1, $var1[1], PDO::PARAM_STR);
			$sth->bindParam(2, $var1[2], PDO::PARAM_STR);
			$sth->bindParam(3, $var1[3], PDO::PARAM_STR);
		}
		break;
	case 6:
		$sth = $PDO->prepare('SELECT feed_name, category, feed FROM feeds WHERE valid = 1 ORDER BY feed_name');
		break;
	case 7:
		$sth = $PDO->prepare('UPDATE feeds SET valid = 0 where feed_name=? AND category=? AND feed=?');
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
