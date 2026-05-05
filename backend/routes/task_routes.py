from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date
from database import get_db
from models import Task, Project, ProjectMember, User
from schemas import TaskSchema, TaskUpdateSchema
from auth import get_current_user, admin_required

router = APIRouter()


@router.get("/dashboard/summary")
def dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "admin":
        tasks = db.query(Task).filter(Task.created_by == current_user.id).all()
    else:
        tasks = db.query(Task).filter(Task.assigned_to == current_user.id).all()

    today = date.today().isoformat()

    total = len(tasks)
    pending = len([t for t in tasks if t.status == "pending"])
    completed = len([t for t in tasks if t.status == "completed"])
    overdue = len([
        t for t in tasks
        if t.due_date and t.due_date < today and t.status != "completed"
    ])

    return {
        "total": total,
        "pending": pending,
        "completed": completed,
        "overdue": overdue
    }


@router.post("/")
def create_task(
    task: TaskSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required)
):
    project = db.query(Project).filter(Project.id == task.project_id).first()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if project.admin_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your project")

    member = db.query(ProjectMember).filter(
        ProjectMember.project_id == task.project_id,
        ProjectMember.user_id == task.assigned_to
    ).first()

    if not member:
        raise HTTPException(status_code=400, detail="User is not a project member")

    new_task = Task(
        title=task.title,
        status=task.status,
        due_date=task.due_date,
        project_id=task.project_id,
        assigned_to=task.assigned_to,
        created_by=current_user.id
    )

    db.add(new_task)
    db.commit()
    db.refresh(new_task)

    return new_task


@router.get("/")
def get_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "admin":
        return db.query(Task).filter(Task.created_by == current_user.id).all()

    return db.query(Task).filter(Task.assigned_to == current_user.id).all()


@router.patch("/{task_id}")
def update_task_status(
    task_id: int,
    task: TaskUpdateSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_task = db.query(Task).filter(Task.id == task_id).first()

    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")

    if current_user.role == "member" and db_task.assigned_to != current_user.id:
        raise HTTPException(status_code=403, detail="Not your task")

    db_task.status = task.status
    db.commit()
    db.refresh(db_task)

    return db_task


@router.delete("/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required)
):
    db_task = db.query(Task).filter(Task.id == task_id).first()

    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")

    if db_task.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed")

    db.delete(db_task)
    db.commit()

    return {"message": "Task deleted successfully"}