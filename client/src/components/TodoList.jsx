// client/src/components/TodoList.jsx
import React from 'react';
import TodoItem from './TodoItem';

export default function TodoList({ todos, onUpdate, onDelete }) {
  return (
    <ul>
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
