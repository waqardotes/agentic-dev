(function () {
  const STORAGE_KEY = 'tasks:v1';
  const form = document.getElementById('task-form');
  const input = document.getElementById('task-input');
  const list = document.getElementById('tasks');
  const countEl = document.getElementById('count');
  const clearBtn = document.getElementById('clear-completed');

  let tasks = [];

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
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
      const li = document.createElement('li');
      li.className = 'task' + (task.done ? ' done' : '');
      li.dataset.id = task.id;

      const label = document.createElement('label');
      label.className = 'task-label';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = !!task.done;
      checkbox.addEventListener('change', () => toggle(task.id));

      const span = document.createElement('span');
      span.className = 'task-text';
      span.textContent = task.text;

      label.appendChild(checkbox);
      label.appendChild(span);

      const del = document.createElement('button');
      del.className = 'btn-delete';
      del.textContent = 'Delete';
      del.addEventListener('click', () => removeTask(task.id));

      li.appendChild(label);
      li.appendChild(del);
      list.appendChild(li);
    });

    const total = tasks.length;
    const remaining = tasks.filter((task) => !task.done).length;
    countEl.textContent = remaining + (remaining === 1 ? ' task' : ' tasks') + ' remaining';
  }

  function addTask(text) {
    const trimmed = (text || '').trim();
    if (!trimmed) return;

    tasks.unshift({ id: uid(), text: trimmed, done: false });
    save();
    render();
  }

  function removeTask(id) {
    tasks = tasks.filter((task) => task.id !== id);
    save();
    render();
  }

  function toggle(id) {
    const task = tasks.find((item) => item.id === id);
    if (!task) return;

    task.done = !task.done;
    save();
    render();
  }

  function clearCompleted() {
    tasks = tasks.filter((task) => !task.done);
    save();
    render();
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

  window.taskApp = { addTask, removeTask, toggle, tasks };
})();
