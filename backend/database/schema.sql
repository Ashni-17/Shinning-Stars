USE stocksense;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('INVENTORY_MANAGER', 'WAREHOUSE_STAFF') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE units_of_measure (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    short_name VARCHAR(20) NOT NULL UNIQUE
);

CREATE TABLE warehouses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    address VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    warehouse_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    parent_location_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_locations_warehouse
        FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_locations_parent
        FOREIGN KEY (parent_location_id) REFERENCES locations(id)
        ON DELETE SET NULL,

    UNIQUE (warehouse_id, code)
);

CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    sku VARCHAR(100) NOT NULL UNIQUE,
    category_id INT NOT NULL,
    uom_id INT NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_products_category
        FOREIGN KEY (category_id) REFERENCES categories(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_products_uom
        FOREIGN KEY (uom_id) REFERENCES units_of_measure(id)
        ON DELETE RESTRICT
);

CREATE TABLE reorder_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    location_id INT NOT NULL,
    minimum_quantity DECIMAL(12,2) NOT NULL DEFAULT 0,
    reorder_quantity DECIMAL(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_reorder_product
        FOREIGN KEY (product_id) REFERENCES products(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_reorder_location
        FOREIGN KEY (location_id) REFERENCES locations(id)
        ON DELETE CASCADE,

    UNIQUE (product_id, location_id)
);

CREATE TABLE stock (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    location_id INT NOT NULL,
    quantity DECIMAL(12,2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_stock_product
        FOREIGN KEY (product_id) REFERENCES products(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_stock_location
        FOREIGN KEY (location_id) REFERENCES locations(id)
        ON DELETE CASCADE,

    UNIQUE (product_id, location_id)
);

CREATE TABLE stock_ledger (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    location_id INT NOT NULL,
    operation_type ENUM(
        'INITIAL',
        'RECEIPT',
        'DELIVERY',
        'TRANSFER_IN',
        'TRANSFER_OUT',
        'ADJUSTMENT'
    ) NOT NULL,
    reference_id INT NULL,
    quantity_change DECIMAL(12,2) NOT NULL,
    quantity_before DECIMAL(12,2) NOT NULL,
    quantity_after DECIMAL(12,2) NOT NULL,
    reason VARCHAR(255),
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ledger_product
        FOREIGN KEY (product_id) REFERENCES products(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_ledger_location
        FOREIGN KEY (location_id) REFERENCES locations(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_ledger_user
        FOREIGN KEY (created_by) REFERENCES users(id)
        ON DELETE RESTRICT
);

CREATE TABLE receipts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    receipt_number VARCHAR(50) NOT NULL UNIQUE,
    supplier_name VARCHAR(150) NOT NULL,
    warehouse_id INT NOT NULL,
    status ENUM(
        'DRAFT',
        'WAITING',
        'READY',
        'DONE',
        'CANCELED'
    ) NOT NULL DEFAULT 'DRAFT',
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    validated_at TIMESTAMP NULL,

    CONSTRAINT fk_receipts_warehouse
        FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_receipts_user
        FOREIGN KEY (created_by) REFERENCES users(id)
        ON DELETE RESTRICT
);

CREATE TABLE receipt_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    receipt_id INT NOT NULL,
    product_id INT NOT NULL,
    location_id INT NOT NULL,
    quantity DECIMAL(12,2) NOT NULL,

    CONSTRAINT fk_receipt_items_receipt
        FOREIGN KEY (receipt_id) REFERENCES receipts(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_receipt_items_product
        FOREIGN KEY (product_id) REFERENCES products(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_receipt_items_location
        FOREIGN KEY (location_id) REFERENCES locations(id)
        ON DELETE RESTRICT
);

CREATE TABLE delivery_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    delivery_id INT NOT NULL,
    product_id INT NOT NULL,
    location_id INT NOT NULL,
    quantity DECIMAL(12,2) NOT NULL,

    CONSTRAINT fk_delivery_items_delivery
        FOREIGN KEY (delivery_id) REFERENCES deliveries(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_delivery_items_product
        FOREIGN KEY (product_id) REFERENCES products(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_delivery_items_location
        FOREIGN KEY (location_id) REFERENCES locations(id)
        ON DELETE RESTRICT
);

CREATE TABLE transfers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transfer_number VARCHAR(50) NOT NULL UNIQUE,
    source_warehouse_id INT NOT NULL,
    destination_warehouse_id INT NOT NULL,
    status ENUM(
        'DRAFT',
        'WAITING',
        'READY',
        'DONE',
        'CANCELED'
    ) NOT NULL DEFAULT 'DRAFT',
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    validated_at TIMESTAMP NULL,

    CONSTRAINT fk_transfers_source_warehouse
        FOREIGN KEY (source_warehouse_id) REFERENCES warehouses(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_transfers_destination_warehouse
        FOREIGN KEY (destination_warehouse_id) REFERENCES warehouses(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_transfers_user
        FOREIGN KEY (created_by) REFERENCES users(id)
        ON DELETE RESTRICT
);

CREATE TABLE transfer_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transfer_id INT NOT NULL,
    product_id INT NOT NULL,
    source_location_id INT NOT NULL,
    destination_location_id INT NOT NULL,
    quantity DECIMAL(12,2) NOT NULL,

    CONSTRAINT fk_transfer_items_transfer
        FOREIGN KEY (transfer_id) REFERENCES transfers(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_transfer_items_product
        FOREIGN KEY (product_id) REFERENCES products(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_transfer_items_source_location
        FOREIGN KEY (source_location_id) REFERENCES locations(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_transfer_items_destination_location
        FOREIGN KEY (destination_location_id) REFERENCES locations(id)
        ON DELETE RESTRICT
);

CREATE TABLE adjustments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    adjustment_number VARCHAR(50) NOT NULL UNIQUE,
    location_id INT NOT NULL,
    reason VARCHAR(255),
    status ENUM(
        'DRAFT',
        'DONE',
        'CANCELED'
    ) NOT NULL DEFAULT 'DRAFT',
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    validated_at TIMESTAMP NULL,

    CONSTRAINT fk_adjustments_location
        FOREIGN KEY (location_id) REFERENCES locations(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_adjustments_user
        FOREIGN KEY (created_by) REFERENCES users(id)
        ON DELETE RESTRICT
);

CREATE TABLE adjustment_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    adjustment_id INT NOT NULL,
    product_id INT NOT NULL,
    system_quantity DECIMAL(12,2) NOT NULL,
    counted_quantity DECIMAL(12,2) NOT NULL,
    difference DECIMAL(12,2) NOT NULL,

    CONSTRAINT fk_adjustment_items_adjustment
        FOREIGN KEY (adjustment_id) REFERENCES adjustments(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_adjustment_items_product
        FOREIGN KEY (product_id) REFERENCES products(id)
        ON DELETE RESTRICT
);

CREATE TABLE password_reset_otps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    otp VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_password_reset_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
);