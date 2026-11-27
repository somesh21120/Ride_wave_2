import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../services/api";

export const createRecurring = createAsyncThunk("recurring/create", async (payload, { rejectWithValue }) => {
  try { const { data } = await api.post("/recurring", payload); return data; }
  catch (e) { return rejectWithValue(e.response?.data?.message || "Could not create recurring ride"); }
});
export const getMyRecurring = createAsyncThunk("recurring/mine", async (_, { rejectWithValue }) => {
  try { const { data } = await api.get("/recurring/my"); return data; }
  catch (e) { return rejectWithValue(e.response?.data?.message); }
});
export const updateRecurring = createAsyncThunk("recurring/update", async ({ id, changes }, { rejectWithValue }) => {
  try { const { data } = await api.put(`/recurring/${id}`, changes); return data; }
  catch (e) { return rejectWithValue(e.response?.data?.message || "Could not update"); }
});
export const deleteRecurring = createAsyncThunk("recurring/delete", async (id, { rejectWithValue }) => {
  try { await api.delete(`/recurring/${id}`); return id; }
  catch (e) { return rejectWithValue(e.response?.data?.message || "Could not delete"); }
});

const recurringSlice = createSlice({
  name: "recurring",
  initialState: { items: [], loading: false, error: null },
  reducers: { clearRecurringError: (s) => { s.error = null; } },
  extraReducers: (b) => {
    b.addCase(getMyRecurring.pending, (s) => { s.loading = true; })
     .addCase(getMyRecurring.fulfilled, (s, a) => { s.loading = false; s.items = a.payload; })
     .addCase(getMyRecurring.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
     .addCase(createRecurring.fulfilled, (s, a) => { s.items.unshift(a.payload); })
     .addCase(createRecurring.rejected, (s, a) => { s.error = a.payload; })
     .addCase(updateRecurring.fulfilled, (s, a) => { s.items = s.items.map(i => i._id === a.payload._id ? a.payload : i); })
     .addCase(deleteRecurring.fulfilled, (s, a) => { s.items = s.items.filter(i => i._id !== a.payload); });
  },
});
export const { clearRecurringError } = recurringSlice.actions;
export default recurringSlice.reducer;
