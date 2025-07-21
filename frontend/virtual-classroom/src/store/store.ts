import { configureStore } from "@reduxjs/toolkit";
import classroomReducer from "../features/classroomSlice";
export const store = configureStore({
  reducer: {
    classroom: classroomReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
