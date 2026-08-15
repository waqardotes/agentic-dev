(function () {
  const STORAGE_KEY = 'tasks:v1';
  const form = document.getElementById('task-form');
  const input = document.getElementById('task-input');
  const list = document.getElementById('tasks');
  const countEl = document.getElementById('count');
  const clearBtn = document.getElementById('clear-completed');
  const statusEl = document.getElementById('status');

  let tasks = [];

  function showStatus(message, kind) {
    statusEl.textContent = message;
    statusEl.className = 'status ' + (kind || 'error');
  }

  function clearStatus() {
    statusEl.textContent = '';
    statusEl.className = 'status';
  }

  function describeError(err) {
    return err && err.message ? err.message : 'unknown error';
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
    const timeEl = document.getElementById('current-time');
    if (timeEl) {
      timeEl.textContent = formatTime(new Date());
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      return true;
    } catch (err) {
      console.error('Failed to persist tasks', err);
      const quotaExceeded =
        err instanceof DOMException &&
        (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED');
      showStatus(
        quotaExceeded
          ? 'Storage is full, so this change was not saved. Delete some tasks and try again.'
          : 'Could not save your tasks (' +
              describeError(err) +
              '). Changes will be lost when you reload.'
      );
      return false;
    }
  }

  function isValidTask(task) {
    return (
      !!task &&
      typeof task === 'object' &&
      typeof task.id === 'string' &&
      typeof task.text === 'string' &&
      (task.createdAt === undefined || typeof task.createdAt === 'string')
    );
  }

  function load() {
    let raw;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch (err) {
      console.error('Failed to read stored tasks', err);
      tasks = [];
      showStatus(
        'Could not read saved tasks (' +
          describeError(err) +
          '). Starting with an empty list.'
      );
      return;
    }

    if (!raw) {
      tasks = [];
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      console.error('Stored tasks are not valid JSON', err);
      tasks = [];
      showStatus('Saved tasks were corrupted and could not be loaded. Starting with an empty list.');
      return;
    }

    if (!Array.isArray(parsed)) {
      console.error('Stored tasks have an unexpected shape', parsed);
      tasks = [];
      showStatus(
        'Saved tasks were in an unexpected format and could not be loaded. Starting with an empty list.'
      );
      return;
    }

    tasks = parsed
      .filter(isValidTask)
      .map((task) => ({
        id: task.id,
        text: task.text,
        done: !!task.done,
        createdAt: task.createdAt
      }));

    const skipped = parsed.length - tasks.length;
    if (skipped > 0) {
      console.warn('Skipped ' + skipped + ' invalid stored task(s)');
      showStatus('Skipped ' + skipped + ' saved task(s) that could not be read.', 'warn');
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

    clearStatus();
    tasks.unshift({ id: uid(), text: trimmed, done: false, createdAt: new Date().toISOString() });
    commit();
  }

  function removeTask(id) {
    clearStatus();
    tasks = tasks.filter((task) => task.id !== id);
    commit();
  }

  function toggle(id) {
    clearStatus();
    const task = tasks.find((item) => item.id === id);
    if (!task) {
      console.warn('Tried to toggle a task that no longer exists', id);
      showStatus('That task no longer exists.', 'warn');
      render();
      return;
    }

    task.done = !task.done;
    commit();
  }

  function updateTask(id, newText) {
    const trimmed = (newText || '').trim();
    if (!trimmed) return;

    clearStatus();
    const task = tasks.find((item) => item.id === id);
    if (!task) {
      console.warn('Tried to update a task that no longer exists', id);
      showStatus('That task no longer exists.', 'warn');
      render();
      return;
    }

    task.text = trimmed;
    commit();
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
    clearStatus();
    tasks = tasks.filter((task) => !task.done);
    commit();
  }

  function commit() {
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
