from __future__ import annotations

from fastapi import APIRouter, Query
from pydantic import BaseModel

from ..services import file_service

router = APIRouter()


@router.get("/files")
def get_files(path: str = Query(default="")):
    return file_service.list_dir(path)


@router.get("/file")
def get_file(path: str = Query(...)):
    return file_service.read_file(path)


class UpdateFileBody(BaseModel):
    content: str


@router.put("/file")
def put_file(path: str = Query(...), payload: UpdateFileBody | None = None):
    content = payload.content if payload else ""
    return file_service.write_file(path, content)
