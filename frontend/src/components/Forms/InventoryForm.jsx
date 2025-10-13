import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Box,
  TextField,
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Typography,
  Paper,
} from "@mui/material";
import { Save, Cancel } from "@mui/icons-material";
import { productService } from "../../services/productService";
import { inventoryService } from "../../services/inventoryService";
import toast from "react-hot-toast";

const InventoryForm = ({ onSubmit, onCancel }) => {
  const [products, setProducts] = useState([]);

  const { control, handleSubmit } = useForm({
    defaultValues: {
      product: "",
      quantity: "",
      transactionType: "Purchase",
    },
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productService.getProducts({ limit: 100 });
      setProducts(response.data.products);
    } catch (error) {
      toast.error("Failed to load products");
    }
  };

  const handleFormSubmit = async (data) => {
    try {
      if (data.transactionType === "Purchase") {
        await inventoryService.addStock(data);
      } else {
        await inventoryService.reduceStock(data);
      }
      toast.success("Success!");
      onSubmit();
    } catch (error) {
      toast.error("Failed");
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(handleFormSubmit)}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Stock Transaction
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Transaction Type</InputLabel>
            <Controller
              name="transactionType"
              control={control}
              render={({ field }) => (
                <Select {...field} label="Transaction Type">
                  <MenuItem value="Purchase">Purchase</MenuItem>
                  <MenuItem value="Sale">Sale</MenuItem>
                </Select>
              )}
            />
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Product</InputLabel>
            <Controller
              name="product"
              control={control}
              render={({ field }) => (
                <Select {...field} label="Product">
                  {products.map((prod) => (
                    <MenuItem key={prod._id} value={prod._id}>
                      {prod.name}
                    </MenuItem>
                  ))}
                </Select>
              )}
            />
          </FormControl>

          <Controller
            name="quantity"
            control={control}
            render={({ field }) => (
              <TextField {...field} fullWidth label="Quantity" type="number" />
            )}
          />

          <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
            <Button
              variant="outlined"
              startIcon={<Cancel />}
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button type="submit" variant="contained" startIcon={<Save />}>
              Submit
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default InventoryForm;
