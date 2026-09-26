USE stocksense;

-- =====================================================
-- 1. USERS
-- =====================================================

INSERT INTO users (name, email, password_hash, role)
VALUES
('Inventory Manager', 'manager@stocksense.com', 'demo_hash_manager', 'INVENTORY_MANAGER'),
('Warehouse Staff', 'staff@stocksense.com', 'demo_hash_staff', 'WAREHOUSE_STAFF');


-- =====================================================
-- 2. CATEGORIES
-- =====================================================

INSERT INTO categories (name, description)
VALUES
('Raw Materials', 'Materials used for manufacturing and production'),
('Finished Goods', 'Ready-to-use finished products'),
('Electronics', 'Electronic equipment and devices'),
('Office Supplies', 'Office and workplace supplies'),
('Furniture', 'Office and warehouse furniture');


-- =====================================================
-- 3. UNITS OF MEASURE
-- =====================================================

INSERT INTO units_of_measure (name, short_name)
VALUES
('Pieces', 'PCS'),
('Kilograms', 'KG'),
('Boxes', 'BOX');


-- =====================================================
-- 4. WAREHOUSES
-- =====================================================

INSERT INTO warehouses (name, code, address)
VALUES
('Central Warehouse', 'WH-CEN', 'Chennai'),
('North Warehouse', 'WH-NOR', 'Chennai'),
('South Warehouse', 'WH-SOU', 'Chennai');


-- =====================================================
-- 5. LOCATIONS
-- =====================================================

INSERT INTO locations
(warehouse_id, name, code, parent_location_id)
VALUES
(1, 'Receiving Area', 'REC-01', NULL),
(1, 'Main Storage', 'STO-01', NULL),
(1, 'Dispatch Area', 'DIS-01', NULL),
(2, 'Main Storage', 'STO-02', NULL),
(2, 'Dispatch Area', 'DIS-02', NULL),
(3, 'Main Storage', 'STO-03', NULL);


-- =====================================================
-- 6. PRODUCTS
-- =====================================================

INSERT INTO products
(name, sku, category_id, uom_id, active)
VALUES
('Steel Rod', 'STL-001', 1, 2, TRUE),
('Aluminium Sheet', 'ALU-002', 1, 2, TRUE),
('Office Laptop', 'LAP-003', 3, 1, TRUE),
('Printer Paper', 'PAP-004', 4, 3, TRUE),
('Office Chair', 'CHR-005', 5, 1, TRUE),
('Barcode Scanner', 'SCN-006', 3, 1, TRUE),
('Storage Rack', 'RCK-007', 5, 1, TRUE),
('Safety Helmet', 'HEL-008', 4, 1, TRUE);


-- =====================================================
-- 7. REORDER RULES
-- =====================================================

INSERT INTO reorder_rules
(product_id, location_id, minimum_quantity, reorder_quantity)
VALUES
(1, 2, 100.00, 250.00),
(2, 2, 50.00, 150.00),
(3, 2, 10.00, 25.00),
(4, 2, 20.00, 100.00),
(5, 2, 10.00, 30.00),
(6, 2, 5.00, 20.00),
(7, 2, 5.00, 15.00),
(8, 2, 20.00, 50.00);


-- =====================================================
-- 8. STOCK
-- =====================================================

INSERT INTO stock
(product_id, location_id, quantity)
VALUES
(1, 2, 350.00),
(2, 2, 120.00),
(3, 2, 8.00),
(4, 2, 75.00),
(5, 2, 18.00),
(6, 2, 3.00),
(7, 2, 12.00),
(8, 2, 60.00);


-- =====================================================
-- 9. PASSWORD RESET OTP
-- =====================================================

INSERT INTO password_reset_otps
(user_id, otp, expires_at, is_used)
VALUES
(1, '482931', DATE_ADD(NOW(), INTERVAL 10 MINUTE), FALSE);

-- =====================================================
-- 10. RECEIPTS
-- =====================================================

INSERT INTO receipts
(receipt_number, supplier_name, warehouse_id, status, created_by)
VALUES
('REC-0001', 'ABC Industrial Supplies', 1, 'DONE', 1),
('REC-0002', 'Tech World Distributors', 1, 'READY', 1),
('REC-0003', 'Office Needs Pvt Ltd', 2, 'WAITING', 1);


-- =====================================================
-- 11. RECEIPT ITEMS
-- =====================================================

INSERT INTO receipt_items
(receipt_id, product_id, location_id, quantity)
VALUES
(1, 1, 1, 200.00),
(1, 2, 1, 100.00),
(2, 3, 1, 15.00),
(2, 6, 1, 10.00),
(3, 4, 4, 50.00);


-- =====================================================
-- 12. DELIVERIES
-- =====================================================

INSERT INTO deliveries
(delivery_number, customer_name, warehouse_id, status, created_by)
VALUES
('DEL-0001', 'Chennai Retail Hub', 1, 'DONE', 1),
('DEL-0002', 'Smart Office Solutions', 1, 'READY', 1),
('DEL-0003', 'Metro Traders', 2, 'WAITING', 1);


-- =====================================================
-- 13. DELIVERY ITEMS
-- =====================================================

INSERT INTO delivery_items
(delivery_id, product_id, location_id, quantity)
VALUES
(1, 3, 2, 5.00),
(1, 5, 2, 4.00),
(2, 4, 2, 20.00),
(2, 6, 2, 2.00),
(3, 8, 4, 15.00);


-- =====================================================
-- 14. INTERNAL TRANSFERS
-- =====================================================

INSERT INTO transfers
(transfer_number, source_warehouse_id, destination_warehouse_id, status, created_by)
VALUES
('TRF-0001', 1, 2, 'DONE', 1),
('TRF-0002', 1, 3, 'READY', 1),
('TRF-0003', 2, 3, 'WAITING', 1);


-- =====================================================
-- 15. TRANSFER ITEMS
-- =====================================================

INSERT INTO transfer_items
(transfer_id, product_id, source_location_id, destination_location_id, quantity)
VALUES
(1, 1, 2, 4, 50.00),
(1, 3, 2, 4, 3.00),
(2, 5, 2, 6, 5.00),
(2, 7, 2, 6, 4.00),
(3, 8, 4, 6, 10.00);


-- =====================================================
-- 16. INVENTORY ADJUSTMENTS
-- =====================================================

INSERT INTO adjustments
(adjustment_number, location_id, reason, status, created_by)
VALUES
('ADJ-0001', 2, 'Physical stock count', 'DONE', 1),
('ADJ-0002', 2, 'Damaged items', 'DRAFT', 1);


-- =====================================================
-- 17. ADJUSTMENT ITEMS
-- =====================================================

INSERT INTO adjustment_items
(adjustment_id, product_id, system_quantity, counted_quantity, difference)
VALUES
(1, 1, 350.00, 348.00, -2.00),
(1, 4, 75.00, 73.00, -2.00),
(2, 6, 3.00, 2.00, -1.00);


-- =====================================================
-- 18. STOCK LEDGER
-- =====================================================

INSERT INTO stock_ledger
(product_id, location_id, operation_type, reference_id,
 quantity_change, quantity_before, quantity_after,
 reason, created_by)
VALUES
(1, 2, 'INITIAL', NULL, 350.00, 0.00, 350.00,
 'Initial stock', 1),

(2, 2, 'INITIAL', NULL, 120.00, 0.00, 120.00,
 'Initial stock', 1),

(3, 2, 'INITIAL', NULL, 8.00, 0.00, 8.00,
 'Initial stock', 1),

(4, 2, 'INITIAL', NULL, 75.00, 0.00, 75.00,
 'Initial stock', 1),

(5, 2, 'INITIAL', NULL, 18.00, 0.00, 18.00,
 'Initial stock', 1),

(6, 2, 'INITIAL', NULL, 3.00, 0.00, 3.00,
 'Initial stock', 1),

(7, 2, 'INITIAL', NULL, 12.00, 0.00, 12.00,
 'Initial stock', 1),

(8, 2, 'INITIAL', NULL, 60.00, 0.00, 60.00,
 'Initial stock', 1);