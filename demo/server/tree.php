<?php
$array = array(
    'id' => 1,
    'text' => "Root",
    'type' => 'root',
    'children' => array(
        array(
            'id' => 11,
            'text' => 'Product',
            'type' => 'module',
            'children' => array(
                array('id' => 111, 'text' => 'Image', 'type' => 'field'),
                array('id' => 111, 'text' => 'Thumb', 'type' => 'field'),
            )
        ),
        array('id' => 12, 'text' => 'News', 'type' => 'field'),
    ),
);


echo json_encode(array($array));