-- Add main_image column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS main_image TEXT;
