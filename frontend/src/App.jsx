import { useEffect, useState } from "react";
import {
  signup,
  login,
  getProjects,
  createProject,
  addMemberToProject,
  getProjectMembers,
  getTasks,
  createTask,
  updateTaskStatus,
  deleteTask,
  getDashboardSummary,
} from "./api";

function App() {
  const token = localStorage.getItem("token");
  return token ? <Dashboard /> : <AuthPage />;
}

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "admin",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isLogin) {
        if (!form.email || !form.password) {
          alert("Please enter email and password");
          return;
        }

        const res = await login({
          email: form.email,
          password: form.password,
        });

        if (res.access_token) {
          localStorage.setItem("token", res.access_token);
          localStorage.setItem("user", JSON.stringify(res.user));
          window.location.reload();
        } else {
          alert(res.detail || "Login failed");
        }
      } else {
        if (!form.name || !form.email || !form.password || !form.role) {
          alert("Please fill all signup fields");
          return;
        }

        const res = await signup(form);

        if (res.detail) {
          alert(res.detail);
        } else {
          alert("Signup successful. Please login now.");
          setIsLogin(true);
          setForm({
            name: "",
            email: "",
            password: "",
            role: "admin",
          });
        }
      }
    } catch (error) {
      console.error(error);
      alert("Backend not connected or server error");
    }
  };

  return (
    <div style={pageStyle}>
      <div style={authCardStyle}>
        <h1 style={titleStyle}>Team Task Manager</h1>
        <p style={{ ...subtitleStyle, marginBottom: "22px" }}>
          Projects, teams, tasks and progress tracking.
        </p>

        <h3 style={sectionTitleStyle}>
          {isLogin ? "Welcome Back" : "Create Account"}
        </h3>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <input
                placeholder="Full Name"
                style={inputStyle}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />

              <select
                style={inputStyle}
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="admin">Admin</option>
                <option value="member">Member</option>
              </select>
            </>
          )}

          <input
            placeholder="Email"
            style={inputStyle}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <input
            type="password"
            placeholder="Password"
            style={inputStyle}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          <button type="submit" style={buttonStyle}>
            {isLogin ? "Login" : "Signup"}
          </button>
        </form>

        <p style={mutedTextStyle}>
          {isLogin ? "Don't have an account?" : "Already have an account?"}
        </p>

        <button
          type="button"
          onClick={() => {
            setIsLogin(!isLogin);
            setForm({
              name: "",
              email: "",
              password: "",
              role: "admin",
            });
          }}
          style={linkButtonStyle}
        >
          Switch to {isLogin ? "Signup" : "Login"}
        </button>
      </div>
    </div>
  );
}

function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    overdue: 0,
  });

  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [projectForm, setProjectForm] = useState({
    title: "",
    description: "",
  });
  const [memberId, setMemberId] = useState("");

  const [taskForm, setTaskForm] = useState({
    title: "",
    assigned_to: "",
    due_date: "",
  });

  const [filter, setFilter] = useState("all");
  const [message, setMessage] = useState("");

  const loadAll = async () => {
    const projectsData = await getProjects();
    const tasksData = await getTasks();
    const summaryData = await getDashboardSummary();

    setProjects(Array.isArray(projectsData) ? projectsData : []);
    setTasks(Array.isArray(tasksData) ? tasksData : []);

    if (summaryData && !summaryData.detail) {
      setSummary(summaryData);
    }

    if (
      Array.isArray(projectsData) &&
      projectsData.length > 0 &&
      !selectedProjectId
    ) {
      setSelectedProjectId(String(projectsData[0].id));
    }
  };

  const loadMembers = async (projectId) => {
    if (!projectId) return;
    const data = await getProjectMembers(projectId);
    setMembers(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    loadMembers(selectedProjectId);
  }, [selectedProjectId]);

  const handleCreateProject = async () => {
    if (!projectForm.title.trim()) {
      setMessage("Please enter project title");
      return;
    }

    const res = await createProject(projectForm);

    if (res.detail) {
      setMessage(res.detail);
    } else {
      setMessage("Project created successfully");
      setProjectForm({ title: "", description: "" });
      loadAll();
    }
  };

  const handleAddMember = async () => {
    if (!selectedProjectId || !memberId) {
      setMessage("Please select project and enter member ID");
      return;
    }

    const res = await addMemberToProject(selectedProjectId, memberId);

    if (res.detail) {
      setMessage(res.detail);
    } else {
      setMessage("Member added successfully");
      setMemberId("");
      loadMembers(selectedProjectId);
    }
  };

  const handleCreateTask = async () => {
    if (
      !selectedProjectId ||
      !taskForm.title ||
      !taskForm.assigned_to ||
      !taskForm.due_date
    ) {
      setMessage("Please fill task title, assignee and due date");
      return;
    }

    const res = await createTask({
      title: taskForm.title,
      project_id: Number(selectedProjectId),
      assigned_to: Number(taskForm.assigned_to),
      due_date: taskForm.due_date,
      status: "pending",
    });

    if (res.detail) {
      setMessage(res.detail);
    } else {
      setMessage("Task created successfully");
      setTaskForm({ title: "", assigned_to: "", due_date: "" });
      loadAll();
    }
  };

  const markComplete = async (id) => {
    await updateTaskStatus(id, "completed");
    loadAll();
  };

  const markPending = async (id) => {
    await updateTaskStatus(id, "pending");
    loadAll();
  };

  const removeTask = async (id) => {
    const res = await deleteTask(id);

    if (res.detail) {
      setMessage(res.detail);
    } else {
      setMessage("Task deleted successfully");
      loadAll();
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === "all") return true;
    return t.status === filter;
  });

  return (
    <div style={pageStyle}>
      <div style={dashboardCardStyle}>
        <div style={headerRow}>
          <div>
            <h1 style={titleStyle}>📋 Team Task Manager</h1>
            <p style={subtitleStyle}>
              Logged in as {user.name} ({user.role})
            </p>
          </div>

          <button
            style={logoutButtonStyle}
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              window.location.reload();
            }}
          >
            Logout
          </button>
        </div>

        {message && <p style={messageStyle}>{message}</p>}

        {user.role === "admin" && (
          <section style={sectionStyle}>
            <h3>Create Project</h3>
            <div style={twoColStyle}>
              <input
                placeholder="Project title"
                value={projectForm.title}
                style={inputStyle}
                onChange={(e) =>
                  setProjectForm({ ...projectForm, title: e.target.value })
                }
              />
              <input
                placeholder="Description"
                value={projectForm.description}
                style={inputStyle}
                onChange={(e) =>
                  setProjectForm({
                    ...projectForm,
                    description: e.target.value,
                  })
                }
              />
            </div>
            <button style={buttonStyle} onClick={handleCreateProject}>
              Create Project
            </button>
          </section>
        )}

        <section style={sectionStyle}>
          <h3>Project</h3>
          <select
            style={inputStyle}
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
          >
            <option value="">Select Project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </section>

        {user.role === "admin" && (
          <section style={sectionStyle}>
            <h3>Team Management</h3>
            <p style={smallTextStyle}>
              Add member using their user ID. Create a member account first,
              then use that ID.
            </p>

            <div style={taskRow}>
              <input
                placeholder="Member user ID"
                value={memberId}
                style={inputStyle}
                onChange={(e) => setMemberId(e.target.value)}
              />
              <button
                style={{ ...buttonStyle, width: "150px" }}
                onClick={handleAddMember}
              >
                Add Member
              </button>
            </div>

            <div>
              {members.map((m) => (
                <span key={m.id} style={memberBadgeStyle}>
                  {m.name} #{m.id}
                </span>
              ))}
            </div>
          </section>
        )}

        {user.role === "admin" && (
          <section style={sectionStyle}>
            <h3>Create & Assign Task</h3>

            <input
              placeholder="Task title"
              value={taskForm.title}
              style={inputStyle}
              onChange={(e) =>
                setTaskForm({ ...taskForm, title: e.target.value })
              }
            />

            <div style={twoColStyle}>
              <select
                style={inputStyle}
                value={taskForm.assigned_to}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, assigned_to: e.target.value })
                }
              >
                <option value="">Assign to member</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} #{m.id}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={taskForm.due_date}
                style={inputStyle}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, due_date: e.target.value })
                }
              />
            </div>

            <button style={buttonStyle} onClick={handleCreateTask}>
              Create Task
            </button>
          </section>
        )}

        <section style={sectionStyle}>
          <h3>Dashboard</h3>

          <div style={statsRow}>
            <div style={statBox}>Total: {summary.total}</div>
            <div style={statBox}>Pending: {summary.pending}</div>
            <div style={statBox}>Completed: {summary.completed}</div>
            <div style={statBox}>Overdue: {summary.overdue}</div>
          </div>

          <div style={filterRow}>
            {["all", "pending", "completed"].map((f) => (
              <button
                key={f}
                style={{
                  ...filterBtn,
                  background: filter === f ? "#2563eb" : "#e5e7eb",
                  color: filter === f ? "white" : "#333",
                }}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          <div style={{ marginTop: "18px" }}>
            {filteredTasks.length === 0 ? (
              <p style={emptyTextStyle}>No tasks found</p>
            ) : (
              filteredTasks.map((t) => (
                <div key={t.id} style={taskCard}>
                  <h3
                    style={{
                      margin: 0,
                      textDecoration:
                        t.status === "completed" ? "line-through" : "none",
                      opacity: t.status === "completed" ? 0.6 : 1,
                    }}
                  >
                    {t.title}
                  </h3>

                  <p style={smallTextStyle}>
                    Project #{t.project_id} | Assigned to #{t.assigned_to} |
                    Due: {t.due_date}
                  </p>

                  <span
                    style={{
                      ...statusBadge,
                      background:
                        t.status === "completed" ? "#22c55e" : "#f59e0b",
                    }}
                  >
                    {t.status}
                  </span>

                  <div style={{ marginTop: "12px" }}>
                    {t.status !== "completed" ? (
                      <button
                        style={{ ...actionBtn, background: "#22c55e" }}
                        onClick={() => markComplete(t.id)}
                      >
                        Complete
                      </button>
                    ) : (
                      <button
                        style={{ ...actionBtn, background: "#f59e0b" }}
                        onClick={() => markPending(t.id)}
                      >
                        Mark Pending
                      </button>
                    )}

                    {user.role === "admin" && (
                      <button
                        style={{ ...actionBtn, background: "#ef4444" }}
                        onClick={() => removeTask(t.id)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start",
  padding: "40px 0",
  background: "linear-gradient(to right, #eef2ff, #f8fafc)",
  fontFamily: "Arial, sans-serif",
};

const authCardStyle = {
  background: "white",
  padding: "35px",
  borderRadius: "16px",
  width: "420px",
  textAlign: "center",
  boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
  marginTop: "80px",
};

const dashboardCardStyle = {
  background: "white",
  padding: "32px",
  borderRadius: "16px",
  width: "760px",
  boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
};

const titleStyle = {
  margin: 0,
  fontSize: "26px",
  fontWeight: "600",
  color: "#111827",
};

const sectionTitleStyle = {
  marginTop: "20px",
  marginBottom: "18px",
  fontSize: "22px",
  color: "#4b5563",
};

const subtitleStyle = {
  fontSize: "14px",
  color: "#666",
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  margin: "10px 0",
  borderRadius: "8px",
  border: "1px solid #ddd",
  outline: "none",
  boxSizing: "border-box",
};

const buttonStyle = {
  width: "100%",
  padding: "12px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600",
};

const linkButtonStyle = {
  background: "none",
  border: "none",
  color: "#2563eb",
  cursor: "pointer",
  fontWeight: "600",
};

const mutedTextStyle = {
  marginTop: "16px",
  color: "#666",
};

const logoutButtonStyle = {
  background: "#ef4444",
  color: "white",
  border: "none",
  padding: "10px 14px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600",
};

const headerRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
};

const taskRow = {
  display: "flex",
  gap: "10px",
  alignItems: "center",
};

const twoColStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "12px",
};

const sectionStyle = {
  marginTop: "22px",
  padding: "18px",
  border: "1px solid #e5e7eb",
  borderRadius: "14px",
  background: "#fff",
};

const filterRow = {
  display: "flex",
  gap: "10px",
  marginTop: "16px",
};

const filterBtn = {
  padding: "8px 14px",
  borderRadius: "20px",
  border: "none",
  cursor: "pointer",
  fontWeight: "600",
};

const statsRow = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: "10px",
  marginTop: "16px",
};

const statBox = {
  background: "#f3f4f6",
  padding: "12px",
  borderRadius: "10px",
  textAlign: "center",
  fontWeight: "600",
};

const taskCard = {
  border: "1px solid #e5e7eb",
  padding: "14px",
  marginTop: "10px",
  borderRadius: "12px",
  background: "#fff",
  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
};

const statusBadge = {
  display: "inline-block",
  marginTop: "8px",
  padding: "4px 10px",
  borderRadius: "20px",
  color: "white",
  fontSize: "12px",
  fontWeight: "600",
};

const actionBtn = {
  marginRight: "8px",
  padding: "7px 11px",
  border: "none",
  color: "white",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "600",
};

const emptyTextStyle = {
  textAlign: "center",
  color: "#666",
  padding: "18px",
};

const smallTextStyle = {
  color: "#666",
  fontSize: "13px",
};

const memberBadgeStyle = {
  display: "inline-block",
  padding: "6px 10px",
  background: "#e0f2fe",
  color: "#0369a1",
  borderRadius: "20px",
  marginRight: "8px",
  marginTop: "8px",
  fontSize: "13px",
  fontWeight: "600",
};

const messageStyle = {
  background: "#eef2ff",
  color: "#3730a3",
  padding: "10px",
  borderRadius: "8px",
  marginTop: "16px",
};

export default App;