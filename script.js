(function () {
  const STORAGE_KEY = 'tasks:v1';
  const byId = (id) => document.getElementById(id);

  const form = byId('task-form');
  const input = byId('task-input');
  const list = byId('tasks');
  const countEl = byId('count');
  const clearBtn = byId('clear-completed');

  let tasks = [];

  // Creates an element, optionally setting class, text, value, and event listeners.
  function el(tag, { className, text, value, on } = {}) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    if (value != null) node.value = value;
    if (on) {
      for (const [event, handler] of Object.entries(on)) node.addEventListener(event, handler);
    }
    return node;
  }

  function formatTime(date) {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function updateCurrentTime() {
    const timeEl = byId('current-time');
    if (timeEl) {
      timeEl.textContent = formatTime(new Date());
    }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  // Applies a mutation to the task list, then persists and re-renders.
  function update(mutate) {
    const next = mutate(tasks);
    if (next) tasks = next;
    save();
    render();
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      tasks = raw ? JSON.parse(raw) : [];
    } catch (e) {
      tasks = [];
    }
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function render() {
    list.innerHTML = '';

    tasks.forEach((task) => {
      const li = el('li', { className: 'task' + (task.done ? ' done' : '') });
      li.dataset.id = task.id;

      const checkbox = el('input', { on: { change: () => toggle(task.id) } });
      checkbox.type = 'checkbox';
      checkbox.checked = !!task.done;

      const startEdit = () => editTask(task.id, task.text);

      const label = el('label', { className: 'task-label' });
      label.append(
        checkbox,
        el('span', { className: 'task-text', text: task.text, on: { click: startEdit } })
      );

      li.appendChild(label);
      if (task.createdAt) {
        li.appendChild(
          el('span', { className: 'task-time', text: formatTime(new Date(task.createdAt)) })
        );
      }

      li.append(
        el('button', { className: 'btn-edit', text: 'Edit', on: { click: startEdit } }),
        el('button', {
          className: 'btn-delete',
          text: 'Delete',
          on: { click: () => removeTask(task.id) },
        })
      );
      list.appendChild(li);
    });

    const remaining = tasks.filter((task) => !task.done).length;
    countEl.textContent = remaining + (remaining === 1 ? ' task' : ' tasks') + ' remaining';
  }

  function addTask(text) {
    const trimmed = (text || '').trim();
    if (!trimmed) return;

    update((items) => {
      items.unshift({ id: uid(), text: trimmed, done: false, createdAt: new Date().toISOString() });
    });
  }

  function removeTask(id) {
    update((items) => items.filter((task) => task.id !== id));
  }

  function toggle(id) {
    const task = tasks.find((item) => item.id === id);
    if (!task) return;

    update(() => {
      task.done = !task.done;
    });
  }

  function updateTask(id, newText) {
    const trimmed = (newText || '').trim();
    if (!trimmed) return;

    const task = tasks.find((item) => item.id === id);
    if (!task) return;

    update(() => {
      task.text = trimmed;
    });
  }

  function editTask(id, currentText) {
    const li = list.querySelector(`[data-id="${id}"]`);
    if (!li) return;

    const label = li.querySelector('.task-label');
    const span = li.querySelector('.task-text');
    const editBtn = li.querySelector('.btn-edit');

    function finish() {
      li.replaceChild(label, li.querySelector('.edit-container'));
      editBtn.style.display = '';
    }

    const editInput = el('input', {
      className: 'edit-input',
      value: currentText,
      on: {
        keydown: (e) => {
          if (e.key === 'Enter') saveBtn.click();
          if (e.key === 'Escape') cancelBtn.click();
        },
      },
    });
    editInput.type = 'text';

    const saveBtn = el('button', {
      className: 'btn-save',
      text: 'Save',
      on: { click: () => updateTask(id, editInput.value) },
    });

    const cancelBtn = el('button', {
      className: 'btn-cancel',
      text: 'Cancel',
      on: { click: finish },
    });

    const container = el('div', { className: 'edit-container' });
    container.append(editInput, saveBtn, cancelBtn);

    li.replaceChild(container, label);
    editBtn.style.display = 'none';
    editInput.focus();
    editInput.select();
  }

  function clearCompleted() {
    update((items) => items.filter((task) => !task.done));
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    addTask(input.value);
    input.value = '';
    input.focus();
  });

  clearBtn.addEventListener('click', () => clearCompleted());

  load();
  render();
  updateCurrentTime();
  setInterval(updateCurrentTime, 1000);

  window.taskApp = { addTask, removeTask, toggle, updateTask, editTask, tasks };
})();
