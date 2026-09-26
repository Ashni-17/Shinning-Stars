const ApiError = require('../middleware/errorMiddleware').ApiError;

const increaseStock = async (client, { productId, warehouseId, locationId, quantity }) => {
  const result = await client.query(
    `UPDATE stock
     SET quantity = quantity + $1
     WHERE product_id = $2 AND warehouse_id = $3 AND location_id = $4
     RETURNING quantity`,
    [quantity, productId, warehouseId, locationId]
  );

  if (result.rowCount === 0) {
    const inserted = await client.query(
      `INSERT INTO stock (product_id, warehouse_id, location_id, quantity)
       VALUES ($1, $2, $3, $4)
       RETURNING quantity`,
      [productId, warehouseId, locationId, quantity]
    );
    return { previousStock: 0, newStock: inserted.rows[0].quantity };
  }

  return {
    previousStock: result.rows[0].quantity - quantity,
    newStock: result.rows[0].quantity
  };
};

const decreaseStock = async (client, { productId, warehouseId, locationId, quantity }) => {
  const result = await client.query(
    `UPDATE stock
     SET quantity = quantity - $1
     WHERE product_id = $2 AND warehouse_id = $3 AND location_id = $4
       AND quantity >= $1
     RETURNING quantity`,
    [quantity, productId, warehouseId, locationId]
  );

  if (result.rowCount === 0) {
    throw new ApiError(400, 'Insufficient stock');
  }

  return {
    previousStock: result.rows[0].quantity + quantity,
    newStock: result.rows[0].quantity
  };
};

const recordLedgerEntry = async (client, {
  productId,
  warehouseId,
  locationId,
  quantity,
  previousStock,
  newStock,
  referenceType,
  referenceId,
  userId
}) => {
  await client.query(
    `INSERT INTO stock_ledger
      (product_id, warehouse_id, location_id, quantity, previous_stock, new_stock, reference_type, reference_id, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [
      productId,
      warehouseId,
      locationId,
      quantity,
      previousStock,
      newStock,
      referenceType,
      referenceId,
      userId
    ]
  );
};

module.exports = {
  increaseStock,
  decreaseStock,
  recordLedgerEntry
};
