// Noms des événements Socket.io (cf. CLAUDE.md).

// Client → Serveur
export const ClientEvents = {
  CREATE_ROOM: 'create_room',
  JOIN_ROOM: 'join_room',
  START_GAME: 'start_game',
  SUBMIT_ANSWER: 'submit_answer',
}

// Serveur → Client
export const ServerEvents = {
  ROOM_CREATED: 'room_created',
  PLAYER_JOINED: 'player_joined',
  PLAYER_LEFT: 'player_left',
  GAME_STARTED: 'game_started',
  ROUND_START: 'round_start',
  TIMER_TICK: 'timer_tick',
  ANSWER_RESULT: 'answer_result',
  ROUND_END: 'round_end',
  SCORES_UPDATE: 'scores_update',
  GAME_OVER: 'game_over',
  GAME_ERROR: 'game_error',
}
