const express = require('express');
const router = express.Router();

const {
getAllTransfers,
getTransferById,
createTransfer,
updateTransfer,
deleteTransfer,
validateTransfer,
} = require('../controllers/transferController');

router.get('/', getAllTransfers);
router.get('/:id', getTransferById);
router.post('/', createTransfer);
router.put('/:id', updateTransfer);
router.delete('/:id', deleteTransfer);
router.post('/:id/validate', validateTransfer);

module.exports = router;
