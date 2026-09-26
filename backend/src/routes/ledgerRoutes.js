const express = require('express');
const router = express.Router();

const {
getLedger,
getLedgerByProduct,
} = require('../controllers/ledgerController');

router.get('/', getLedger);
router.get('/:productId', getLedgerByProduct);

module.exports = router;
