const BASE_URL = "https://team-task-manager-production-507c.up.railway.app";

const getToken = () => localStorage.getItem("token");

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

export const signup = async (data) => {
  const res = await fetch(`${BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const login = async (data) => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const getProjects = async () => {
  const res = await fetch(`${BASE_URL}/projects/`, {
    headers: authHeaders(),
  });
  return res.json();
};

export const createProject = async (data) => {
  const res = await fetch(`${BASE_URL}/projects/`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

export const addMemberToProject = async (projectId, userId) => {
  const res = await fetch(`${BASE_URL}/projects/${projectId}/members`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ user_id: Number(userId) }),
  });
  return res.json();
};

export const getProjectMembers = async (projectId) => {
  const res = await fetch(`${BASE_URL}/projects/${projectId}/members`, {
    headers: authHeaders(),
  });
  return res.json();
};

export const getTasks = async () => {
  const res = await fetch(`${BASE_URL}/tasks/`, {
    headers: authHeaders(),
  });
  return res.json();
};

export const createTask = async (data) => {
  const res = await fetch(`${BASE_URL}/tasks/`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

export const updateTaskStatus = async (id, status) => {
  const res = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  });
  return res.json();
};

export const deleteTask = async (id) => {
  const res = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return res.json();
};

export const getDashboardSummary = async () => {
  const res = await fetch(`${BASE_URL}/tasks/dashboard/summary`, {
    headers: authHeaders(),
  });
  return res.json();
};