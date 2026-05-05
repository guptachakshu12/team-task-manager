from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Project, ProjectMember, User
from schemas import ProjectSchema, AddMemberSchema
from auth import get_current_user, admin_required

router = APIRouter()

@router.post("/")
def create_project(
    project: ProjectSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required)
):
    new_project = Project(
        title=project.title,
        description=project.description,
        admin_id=current_user.id
    )

    db.add(new_project)
    db.commit()
    db.refresh(new_project)

    member = ProjectMember(project_id=new_project.id, user_id=current_user.id)
    db.add(member)
    db.commit()

    return new_project


@router.get("/")
def get_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "admin":
        return db.query(Project).filter(Project.admin_id == current_user.id).all()

    memberships = db.query(ProjectMember).filter(
        ProjectMember.user_id == current_user.id
    ).all()

    project_ids = [m.project_id for m in memberships]

    return db.query(Project).filter(Project.id.in_(project_ids)).all()


@router.post("/{project_id}/members")
def add_member(
    project_id: int,
    member: AddMemberSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required)
):
    project = db.query(Project).filter(Project.id == project_id).first()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if project.admin_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your project")

    user = db.query(User).filter(User.id == member.user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    existing = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == member.user_id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="User already added")

    new_member = ProjectMember(project_id=project_id, user_id=member.user_id)
    db.add(new_member)
    db.commit()

    return {"message": "Member added successfully"}


@router.get("/{project_id}/members")
def get_project_members(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    members = db.query(ProjectMember).filter(ProjectMember.project_id == project_id).all()

    result = []
    for m in members:
        user = db.query(User).filter(User.id == m.user_id).first()
        if user:
            result.append({
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role
            })

    return result