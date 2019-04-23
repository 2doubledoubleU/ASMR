<?php
$var1 = $_POST;

$PDO = new PDO('sqlite:/var/www/html/RSS/RSS.sqlite');

switch($var1[0]) {
	case 1:
		if ($var1[1] == 2) {
			$sth = $PDO->prepare('SELECT category, count(uid) as amount FROM article_entries GROUP BY category');
		} else {
			$sth = $PDO->prepare('SELECT category, count(uid) as amount FROM article_entries where read=? GROUP BY category');
			$sth->bindParam(1, $var1[1], PDO::PARAM_STR);
		}
		break;
	case 2:
		if ($var1[1] == 2) {
			$sth = $PDO->prepare('SELECT feed, category, count(uid) as amount FROM article_entries GROUP BY feed');
		} else {
			$sth = $PDO->prepare('SELECT feed, category, count(uid) as amount FROM article_entries where read=? GROUP BY feed');
			$sth->bindParam(1, $var1[1], PDO::PARAM_STR);
		}
		break;
	case 3:
		if ($var1[1] == 2) {
			if (empty($var1[2])) {
				$sth = $PDO->prepare('SELECT * FROM article_entries order by added DESC');
			} elseif (empty($var1[3])) {
				$sth = $PDO->prepare('SELECT * FROM article_entries where category=? order by added DESC');
				$sth->bindParam(1, $var1[2], PDO::PARAM_STR);
			} else {
				$sth = $PDO->prepare('SELECT * FROM article_entries where feed=? order by added DESC');
				$sth->bindParam(1, $var1[3], PDO::PARAM_STR);
			}
		} else {
			if (empty($var1[2])) {
				$sth = $PDO->prepare('SELECT * FROM article_entries where read=? order by added DESC');
				$sth->bindParam(1, $var1[1], PDO::PARAM_STR);
			} elseif (empty($var1[3])) {
				$sth = $PDO->prepare('SELECT * FROM article_entries where read=? and category=? order by added DESC');
				$sth->bindParam(1, $var1[1], PDO::PARAM_STR);
				$sth->bindParam(2, $var1[2], PDO::PARAM_STR);
			} else {
				$sth = $PDO->prepare('SELECT * FROM article_entries where read=? and feed=? order by added DESC');
				$sth->bindParam(1, $var1[1], PDO::PARAM_STR);
				$sth->bindParam(2, $var1[3], PDO::PARAM_STR);
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
}

$sth->execute();
$result = $sth->fetchall(PDO::FETCH_OBJ);

echo json_encode($result);

?>
