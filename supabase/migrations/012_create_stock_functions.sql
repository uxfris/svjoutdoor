-- Create function to decrease stock
CREATE OR REPLACE FUNCTION decrease_stock(product_id INTEGER, quantity INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE produk 
  SET stok = stok - quantity 
  WHERE id_produk = product_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product with id % not found', product_id;
  END IF;
  
  IF (SELECT stok FROM produk WHERE id_produk = product_id) < 0 THEN
    RAISE EXCEPTION 'Insufficient stock for product %', product_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to increase stock
CREATE OR REPLACE FUNCTION increase_stock(product_id INTEGER, quantity INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE produk 
  SET stok = stok + quantity 
  WHERE id_produk = product_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product with id % not found', product_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get low stock products
CREATE OR REPLACE FUNCTION get_low_stock_products(threshold INTEGER DEFAULT 10)
RETURNS TABLE (
  id_produk INTEGER,
  nama_produk TEXT,
  stok INTEGER,
  nama_kategori TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id_produk,
    p.nama_produk,
    p.stok,
    k.nama_kategori
  FROM produk p
  JOIN kategori k ON p.id_kategori = k.id_kategori
  WHERE p.stok <= threshold
  ORDER BY p.stok ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
