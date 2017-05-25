<?php
sleep(2);
$a = rand(0, 10);
if ($a % 2) {
    throw new Exception('uploa fail');
}

echo json_encode(array('status' => true));