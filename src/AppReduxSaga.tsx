import createSagaMiddleware from '@redux-saga/core';
import {
  configureStore,
  createAction,
  createReducer,
  createSelector,
  PayloadAction,
} from '@reduxjs/toolkit';
import axios from 'axios';
import React, { useCallback, useEffect, useRef } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { put, takeEvery } from 'redux-saga/effects';

const axiosClient = axios.create({
  baseURL: 'http://localhost:3000/',
});

export interface Todo {
  id: number;
  text: string;
  active: boolean;
  done: boolean;
}

const getTodos = async () => (await axiosClient.get<Todo[]>('/todos')).data;

const createTodo = (text: string): Promise<Todo> =>
  axiosClient.post('/todos', { text });

const updateTodo = (todo: Todo): Promise<Todo> =>
  axiosClient.put(`/todos/${todo.id}`, todo);

const deleteTodo = ({ id }: Todo): Promise<Todo> =>
  axiosClient.delete(`/todos/${id}`);

function* getTodosAction() {
  const todos: Todo[] = yield getTodos();
  yield put({ type: 'TODOS_FETCH_SUCCEEDED', payload: todos });
}

const fetchTodos = createAction('TODOS_FETCH_REQUESTED');

const toggleTodo = createAction(
  'UPDATE_TODO_REQUESTED',
  function prepare(todo: Todo) {
    return {
      payload: {
        ...todo,
        done: !todo.done,
      },
    };
  }
);

const removeTodo = createAction<Todo>('DELETE_TODO_REQUESTED');
const addTodo = createAction<string>('CREATE_TODO_REQUESTED');

function* createTodoAction({
  payload,
}: {
  type: 'CREATE_TODO_REQUESTED';
  payload: string;
}) {
  yield createTodo(payload);
  yield put({ type: 'TODOS_FETCH_REQUESTED' });
}

function* updateTodoAction({
  payload,
}: {
  type: 'UPDATE_TODO_REQUESTED';
  payload: Todo;
}) {
  yield updateTodo(payload);
  yield put({ type: 'TODOS_FETCH_REQUESTED' });
}

function* deleteTodoAction({
  payload,
}: {
  type: 'DELETE_TODO_REQUESTED';
  payload: Todo;
}) {
  yield deleteTodo(payload);
  yield put({ type: 'TODOS_FETCH_REQUESTED' });
}

function* rootSaga() {
  yield takeEvery('TODOS_FETCH_REQUESTED', getTodosAction);
  yield takeEvery('UPDATE_TODO_REQUESTED', updateTodoAction);
  yield takeEvery('DELETE_TODO_REQUESTED', deleteTodoAction);
  yield takeEvery('CREATE_TODO_REQUESTED', createTodoAction);
}

const reducer = createReducer([] as Todo[], {
  ['TODOS_FETCH_SUCCEEDED']: (state, action: PayloadAction<Todo[]>) =>
    action.payload,
});

const sagaMiddleware = createSagaMiddleware();

export const store = configureStore({ reducer, middleware: [sagaMiddleware] });

sagaMiddleware.run(rootSaga);

const selectTodos = createSelector([(state: Todo[]) => state], state => state);

function TodoApp() {
  const dispatch = useDispatch();
  const todos = useSelector(selectTodos);

  useEffect(() => {
    dispatch(fetchTodos());
  }, []);

  const textRef = useRef<HTMLInputElement>(null);

  const onAdd = useCallback(() => {
    dispatch(addTodo(textRef.current!.value));
    textRef.current!.value = '';
  }, [dispatch]);

  return (
    <div className="App">
      <div className="todos">
        {todos?.map(todo => (
          <React.Fragment key={todo.id}>
            <div>
              <input
                type="checkbox"
                checked={todo.done}
                onChange={() => dispatch(toggleTodo(todo))}
              />
              <span>{todo.text}</span>
            </div>
            <button onClick={() => dispatch(removeTodo(todo))}>Delete</button>
          </React.Fragment>
        ))}
      </div>
      <div className="add">
        <input type="text" ref={textRef} />
        <button onClick={onAdd}>Add</button>
      </div>
    </div>
  );
}

function App() {
  return (
    <Provider store={store}>
      <TodoApp />
    </Provider>
  );
}

export default App;
