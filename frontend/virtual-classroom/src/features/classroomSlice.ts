import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface Participant {
  id: string;
  name: string;
  muted: boolean;
  videoOn: Boolean;
}

interface ClassroomState {
  participants: Participant[];
  chat: string[];
  role: "teacher" | "student";
}

const initialState: ClassroomState = {
  participants: [],
  chat: [],
  role: "student",
};

const classroomSlice = createSlice({
  name: "classroom",
  initialState,
  reducers: {
    setParticipants(state, action: PayloadAction<Participant[]>) {
      state.participants = action.payload;
    },
    addChatMessage(state, action: PayloadAction<string>) {
      state.chat.push(action.payload);
    },
    setRole(state, action: PayloadAction<"teacher" | "student">) {
      state.role = action.payload;
    },
    updateParticipantMute(
      state,
      action: PayloadAction<{ id: string; muted: boolean }>
    ) {
      const participant = state.participants.find(
        (p) => p.id === action.payload.id
      );
      if (participant) participant.muted = action.payload.muted;
    },
    updateParticipantVideo(
      state,
      action: PayloadAction<{ id: string; videoOn: boolean }>
    ) {
      const participant = state.participants.find(
        (p) => p.id === action.payload.id
      );
      if (participant) participant.videoOn = action.payload.videoOn;
    },
  },
});

export const {
  setParticipants,
  addChatMessage,
  setRole,
  updateParticipantMute,
  updateParticipantVideo,
} = classroomSlice.actions;
export default classroomSlice.reducer;
