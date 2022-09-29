import {
  useQuery,
  useMutation,
  QueryClientProvider,
  QueryClient,
} from '@tanstack/react-query';

import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import axios from 'axios';
import React from 'react';
import { useState } from 'react';

interface Todo {
  id: number;
  text: string;
  active: boolean;
  done: boolean;
}

const axiosClient = axios.create({
  baseURL: 'http://localhost:3000/',
});

const queryClient = new QueryClient();

function TodosApp() {
  const [text, setText] = useState('');

  const { data: todos } = useQuery<Todo[]>(
    ['todos'],
    async () => (await axiosClient.get<Todo[]>('/todos')).data,
    {
      initialData: [],
    }
  );

  const updateMutation = useMutation<Response, unknown, Todo>(
    todo => axiosClient.put(`/todos/${todo.id}`, todo),
    {
      onSettled: () => queryClient.invalidateQueries(['todos']),
    }
  );

  const deleteMutation = useMutation<Response, unknown, Todo>(
    ({ id }) => axiosClient.delete(`/todos/${id}`),
    {
      onSettled: () => queryClient.invalidateQueries(['todos']),
    }
  );

  const createMutation = useMutation<Response, unknown, { text: string }>(
    data => axiosClient.post('/todos', data),
    {
      onSettled: () => {
        queryClient.invalidateQueries(['todos']);
        setText('');
      },
    }
  );

  return (
    <div className="App">
      <div className="todos">
        {todos?.map(todo => (
          <React.Fragment key={todo.id}>
            <div>
              <input
                type="checkbox"
                checked={todo.done}
                onChange={() => {
                  updateMutation.mutate({ ...todo, done: !todo.done });
                }}
              />
              <span>{todo.text}</span>
            </div>
            <button
              onClick={() => {
                deleteMutation.mutate(todo);
              }}
            >
              Delete
            </button>
          </React.Fragment>
        ))}
      </div>
      <div className="add">
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <button
          onClick={() => {
            createMutation.mutate({ text });
          }}
        >
          Add
        </button>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TodosApp />
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
}

export default App;
