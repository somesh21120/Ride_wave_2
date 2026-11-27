import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import rideReducer from "./rideSlice";
import recurringReducer from "./recurringSlice";
export const store = configureStore({
  reducer: { auth: authReducer, ride: rideReducer, recurring: recurringReducer },
});
export default store;
