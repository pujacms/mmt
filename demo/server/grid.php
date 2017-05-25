<?php
/*
sqlite_open('puja_mmt_demo');
sqlite_query('CREATE TABLE IF NOT EXISTS media(
  `id` INT(5) AUTO_INCREMENT,
  `name` VARCHAR(255),
  `src` VARCHAR (255),
  `alt` VARCHAR (255),
  `description` TEXT,
  `image_size` VARCHAR(50),
  `thumb_size` VARCHAR (50),
  PRIMARY KEY (`id`))');

$select = sqlite_query('select count(*) as total from media');
$result = sqlite_fetch_array($select);
*/
$filter = empty($_GET['filter']) ? null : $_GET['filter'] . '-';
$page = empty($_GET['page']) ? 0: (int) $_GET['page'] - 1;
$limit = empty($_GET['rows']) ? 10: (int) $_GET['rows'];
$total = 40;
$grid = array();
for($i = $page * $limit; $i < ($page + 1) * $limit; $i++) {
    $grid[] = array(
        'pkid' => $i,
        'name' => 'File ' . $filter . $i,
        'src' => 'images/' . $i . '.jpg',
        'alt' => 'Alt ' . $i,
        'description' => 'Desc ' . $i,
        'image_size' => $i . '00x100',
        'thumb_size' => $i . '0x10'
    );
};
echo json_encode(array('rows' => $grid, 'total' => $total));
