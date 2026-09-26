const express = require('express');
const router = express.Router();
const c = require('../controllers/ledgerController');

router.get('/', c.getLedger);
router.get('/product/:productId', c.getLedgerByProduct);

module.exports = router;
