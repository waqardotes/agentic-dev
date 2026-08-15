(function () {
  const STORAGE_KEY = 'tasks:v1';
  const form = document.getElementById('task-form');
  const input = document.getElementById('task-input');
  const list = document.getElementById('tasks');
  const countEl = document.getElementById('count');
  const clearBtn = document.getElementById('clear-completed');

  let tasks = [];

  function formatTime(date) {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function updateCurrentTime() {
    const timeEl = document.getElementById('current-time');
    if (timeEl) {
      timeEl.textContent = formatTime(new Date());
    }
  }

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
      span.addEventListener('click', () => editTask(task.id, task.text));

      label.appendChild(checkbox);
      label.appendChild(span);

      const taskTime = document.createElement('span');
      taskTime.className = 'task-time';
      if (task.createdAt) {
        taskTime.textContent = formatTime(new Date(task.createdAt));
      }

      const editBtn = document.createElement('button');
      editBtn.className = 'btn-edit';
      editBtn.textContent = 'Edit';
      editBtn.addEventListener('click', () => editTask(task.id, task.text));

      const del = document.createElement('button');
      del.className = 'btn-delete';
      del.textContent = 'Delete';
      del.addEventListener('click', () => removeTask(task.id));

      li.appendChild(label);
      if (task.createdAt) {
        li.appendChild(taskTime);
      }
      li.appendChild(editBtn);
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

    tasks.unshift({ id: uid(), text: trimmed, done: false, createdAt: new Date().toISOString() });
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

  function updateTask(id, newText) {
    const trimmed = (newText || '').trim();
    if (!trimmed) return;

    const task = tasks.find((item) => item.id === id);
    if (!task) return;

    task.text = trimmed;
    save();
    render();
  }

  function editTask(id, currentText) {
    const li = list.querySelector(`[data-id="${id}"]`);
    if (!li) return;

    const label = li.querySelector('.task-label');
    const span = li.querySelector('.task-text');
    const editBtn = li.querySelector('.btn-edit');

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'edit-input';
    input.value = currentText;

    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn-save';
    saveBtn.textContent = 'Save';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn-cancel';
    cancelBtn.textContent = 'Cancel';

    function finish() {
      li.replaceChild(label, li.querySelector('.edit-container'));
      editBtn.style.display = '';
    }

    saveBtn.addEventListener('click', () => {
      updateTask(id, input.value);
    });

    cancelBtn.addEventListener('click', finish);

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') saveBtn.click();
      if (e.key === 'Escape') cancelBtn.click();
    });

    const container = document.createElement('div');
    container.className = 'edit-container';
    container.appendChild(input);
    container.appendChild(saveBtn);
    container.appendChild(cancelBtn);

    li.replaceChild(container, label);
    editBtn.style.display = 'none';
    input.focus();
    input.select();
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
  updateCurrentTime();
  setInterval(updateCurrentTime, 1000);

  window.taskApp = { addTask, removeTask, toggle, updateTask, editTask, tasks };
})();
