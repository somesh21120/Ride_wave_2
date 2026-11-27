import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../services/api";

export const bookRide = createAsyncThunk("ride/book", async (rideData, { rejectWithValue }) => {
  try { const { data } = await api.post("/rides/book", rideData); return data; }
  catch (error) { return rejectWithValue(error.response?.data?.message || "Failed to book ride"); }
});
export const getMyRides = createAsyncThunk("ride/myRides", async (_, { rejectWithValue }) => {
  try { const { data } = await api.get("/rides/my-rides"); return data; }
  catch (error) { return rejectWithValue(error.response?.data?.message); }
});
export const getAvailableRides = createAsyncThunk("ride/available", async (_, { rejectWithValue }) => {
  try { const { data } = await api.get("/rides/available"); return data; }
  catch (error) { return rejectWithValue(error.response?.data?.message); }
});
export const getOpenPools = createAsyncThunk("ride/openPools", async (_, { rejectWithValue }) => {
  try { const { data } = await api.get("/rides/pools"); return data; }
  catch (error) { return rejectWithValue(error.response?.data?.message); }
});
export const joinPool = createAsyncThunk("ride/joinPool", async ({ rideId, pickupLocation, distance }, { rejectWithValue }) => {
  try { const { data } = await api.post(`/rides/${rideId}/join`, { pickupLocation, distance }); return data; }
  catch (error) { return rejectWithValue(error.response?.data?.message || "Could not join pool"); }
});
export const leavePool = createAsyncThunk("ride/leavePool", async (rideId, { rejectWithValue }) => {
  try { const { data } = await api.post(`/rides/${rideId}/leave`); return data; }
  catch (error) { return rejectWithValue(error.response?.data?.message || "Could not leave pool"); }
});

const rideSlice = createSlice({
  name: "ride",
  initialState: { rides: [], availableRides: [], openPools: [], currentRide: null, loading: false, error: null },
  reducers: { clearRideError: (s) => { s.error = null; }, setCurrentRide: (s, a) => { s.currentRide = a.payload; } },
  extraReducers: (b) => {
    b.addCase(bookRide.pending, (s) => { s.loading = true; s.error = null; })
     .addCase(bookRide.fulfilled, (s, a) => { s.loading = false; s.currentRide = a.payload; })
     .addCase(bookRide.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
     .addCase(getMyRides.pending, (s) => { if (!s.rides.length) s.loading = true; }) // background refresh: keep showing current list
     .addCase(getMyRides.fulfilled, (s, a) => { s.loading = false; s.rides = Array.isArray(a.payload) ? a.payload : []; })
     .addCase(getMyRides.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
     .addCase(getAvailableRides.pending, (s) => { if (!s.availableRides.length) s.loading = true; })
     .addCase(getAvailableRides.fulfilled, (s, a) => { s.loading = false; s.availableRides = Array.isArray(a.payload) ? a.payload : []; })
     .addCase(getAvailableRides.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
     .addCase(getOpenPools.pending, (s) => { s.loading = true; })
     .addCase(getOpenPools.fulfilled, (s, a) => { s.loading = false; s.openPools = Array.isArray(a.payload) ? a.payload : []; })
     .addCase(getOpenPools.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
     .addCase(joinPool.fulfilled, (s) => { s.error = null; })
     .addCase(joinPool.rejected, (s, a) => { s.error = a.payload; })
     .addCase(leavePool.fulfilled, (s) => { s.error = null; })
     .addCase(leavePool.rejected, (s, a) => { s.error = a.payload; });
  },
});
export const { clearRideError, setCurrentRide } = rideSlice.actions;
export default rideSlice.reducer;
