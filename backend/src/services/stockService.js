const { ApiError } = require('../middleware/errorMiddleware');

const getStockRow = async (client, { productId, warehouseId, locationId }) => {
  const result = await client.query(
    `SELECT *
     FROM stock
     WHERE product_id = $1
       AND warehouse_id = $2
       AND location_id IS NOT DISTINCT FROM $3
     FOR UPDATE`,
    [productId, warehouseId, locationId || null]
  );

  return result.rows[0] || null;
};

const increaseStock = async (
  client,
  { productId, warehouseId, locationId, quantity }
) => {
  const amount = Number(quantity);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new ApiError(400, 'Quantity must be greater than 0');
  }

  const location = locationId || null;

  const existing = await getStockRow(client, {
    productId,
    warehouseId,
    locationId: location,
  });

  const previousStock = existing ? Number(existing.quantity) : 0;
  const newStock = previousStock + amount;

  if (existing) {
    await client.query(
      `UPDATE stock
       SET quantity = $1, updated_at = NOW()
       WHERE id = $2`,
      [newStock, existing.id]
    );
  } else {
    await client.query(
      `INSERT INTO stock
       (product_id, warehouse_id, location_id, quantity)
       VALUES ($1, $2, $3, $4)`,
      [productId, warehouseId, location, newStock]
    );
  }

  return {
    previousStock,
    newStock,
  };
};

const decreaseStock = async (
  client,
  { productId, warehouseId, locationId, quantity }
) => {
  const amount = Number(quantity);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new ApiError(400, 'Quantity must be greater than 0');
  }

  const existing = await getStockRow(client, {
    productId,
    warehouseId,
    locationId: locationId || null,
  });

  const previousStock = existing ? Number(existing.quantity) : 0;

  if (previousStock < amount) {
    throw new ApiError(
      400,
      `Insufficient stock. Available: ${previousStock}, requested: ${amount}`
    );
  }

  const newStock = previousStock - amount;

  await client.query(
    `UPDATE stock
     SET quantity = $1, updated_at = NOW()
     WHERE id = $2`,
    [newStock, existing.id]
  );

  return {
    previousStock,
    newStock,
  };
};

const setStock = async (
  client,
  { productId, warehouseId, locationId, countedQuantity }
) => {
  const quantity = Number(countedQuantity);

  if (!Number.isFinite(quantity) || quantity < 0) {
    throw new ApiError(400, 'Counted quantity cannot be negative');
  }

  const location = locationId || null;

  const existing = await getStockRow(client, {
    productId,
    warehouseId,
    locationId: location,
  });

  const previousStock = existing ? Number(existing.quantity) : 0;
  const newStock = quantity;
  const delta = newStock - previousStock;

  if (existing) {
    await client.query(
      `UPDATE stock
       SET quantity = $1, updated_at = NOW()
       WHERE id = $2`,
      [newStock, existing.id]
    );
  } else if (newStock > 0) {
    await client.query(
      `INSERT INTO stock
       (product_id, warehouse_id, location_id, quantity)
       VALUES ($1, $2, $3, $4)`,
      [productId, warehouseId, location, newStock]
    );
  }

  return {
    previousStock,
    newStock,
    delta,
  };
};

const recordLedgerEntry = async (
  client,
  {
    productId,
    movementType,
    quantity,
    sourceWarehouseId,
    sourceLocationId,
    destinationWarehouseId,
    destinationLocationId,
    referenceType,
    referenceId,
    previousStock,
    newStock,
    userId,
  }
) => {
  await client.query(
    `INSERT INTO stock_ledger (
      product_id,
      movement_type,
      quantity,
      source_warehouse_id,
      source_location_id,
      destination_warehouse_id,
      destination_location_id,
      reference_type,
      reference_id,
      previous_stock,
      new_stock,
      created_by
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
    )`,
    [
      productId,
      movementType,
      quantity,
      sourceWarehouseId || null,
      sourceLocationId || null,
      destinationWarehouseId || null,
      destinationLocationId || null,
      referenceType || null,
      referenceId || null,
      previousStock,
      newStock,
      userId || null,
    ]
  );
};

module.exports = {
  getStockRow,
  increaseStock,
  decreaseStock,
  setStock,
  recordLedgerEntry,
};