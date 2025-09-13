from __future__ import annotations

from typing import List, Optional
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from ..models.rbs import RBSNode


def list_nodes(db: Session, owner_id: int) -> List[RBSNode]:
    stmt = select(RBSNode).where(RBSNode.owner_id == owner_id).order_by(RBSNode.parent_id, RBSNode.order_index)
    return list(db.scalars(stmt))


def list_all_nodes(db: Session) -> List[RBSNode]:
    """Get all RBS nodes regardless of owner (for managers/admins)"""
    stmt = select(RBSNode).order_by(RBSNode.parent_id, RBSNode.order_index)
    return list(db.scalars(stmt))


def list_tree(db: Session, owner_id: int):
    nodes = list_nodes(db, owner_id)
    id_to_node = {n.id: n for n in nodes}
    # Build adjacency
    for n in nodes:
        n.children = []
    roots = []
    for n in nodes:
        if n.parent_id and n.parent_id in id_to_node:
            id_to_node[n.parent_id].children.append(n)
        else:
            roots.append(n)
    return roots


def list_all_tree(db: Session):
    """Get all RBS nodes as a tree regardless of owner (for managers/admins)"""
    nodes = list_all_nodes(db)
    id_to_node = {n.id: n for n in nodes}
    # Build adjacency
    for n in nodes:
        n.children = []
    roots = []
    for n in nodes:
        if n.parent_id and n.parent_id in id_to_node:
            id_to_node[n.parent_id].children.append(n)
        else:
            roots.append(n)
    return roots


def create_node(db: Session, owner_id: int, **data) -> RBSNode:
    # If order_index not provided or is 0/invalid, append to end among siblings
    parent_id = data.get("parent_id")
    if (
        "order_index" not in data
        or data["order_index"] is None
        or (isinstance(data["order_index"], int) and data["order_index"] < 1)
    ):
        max_order = db.scalar(
            select(func.max(RBSNode.order_index)).where(
                RBSNode.owner_id == owner_id, RBSNode.parent_id == parent_id
            )
        )
        data["order_index"] = (max_order or 0) + 1
    node = RBSNode(owner_id=owner_id, **data)
    db.add(node)
    db.commit()
    db.refresh(node)
    return node


def update_node(db: Session, owner_id: int, node_id: int, **updates) -> Optional[RBSNode]:
    node = db.get(RBSNode, node_id)
    if not node or node.owner_id != owner_id:
        return None
    for k, v in updates.items():
        if v is not None:
            setattr(node, k, v)
    db.commit()
    db.refresh(node)
    return node


def delete_node(db: Session, owner_id: int, node_id: int) -> bool:
    node = db.get(RBSNode, node_id)
    if not node or node.owner_id != owner_id:
        return False
    db.delete(node)
    db.commit()
    return True


def move_node(db: Session, owner_id: int, node_id: int, direction: str) -> Optional[RBSNode]:
    node = db.get(RBSNode, node_id)
    if not node or node.owner_id != owner_id:
        return None
    # Get siblings ordered by order_index
    siblings = list(
        db.scalars(
            select(RBSNode)
            .where(RBSNode.owner_id == owner_id, RBSNode.parent_id == node.parent_id)
            .order_by(RBSNode.order_index, RBSNode.id)
        )
    )
    # Normalize order_index to unique sequential values if duplicates exist
    seen = set()
    duplicates = False
    for s in siblings:
        key = s.order_index
        if key in seen:
            duplicates = True
            break
        seen.add(key)
    if duplicates or any((s.order_index or 0) < 1 for s in siblings):
        for idx, s in enumerate(siblings, start=1):
            s.order_index = idx
        db.flush()
    try:
        idx = next(i for i, s in enumerate(siblings) if s.id == node.id)
    except StopIteration:
        return node
    if direction == "up" and idx > 0:
        prev = siblings[idx - 1]
        node.order_index, prev.order_index = prev.order_index, node.order_index
    elif direction == "down" and idx < len(siblings) - 1:
        nxt = siblings[idx + 1]
        node.order_index, nxt.order_index = nxt.order_index, node.order_index
    else:
        return node
    db.commit()
    db.refresh(node)
    return node


def update_node_any(db: Session, node_id: int, **updates) -> Optional[RBSNode]:
    """Update any RBS node (for managers/admins)"""
    node = db.get(RBSNode, node_id)
    if not node:
        return None
    for k, v in updates.items():
        if v is not None:
            setattr(node, k, v)
    db.commit()
    db.refresh(node)
    return node


def delete_node_any(db: Session, node_id: int) -> bool:
    """Delete any RBS node (for managers/admins)"""
    node = db.get(RBSNode, node_id)
    if not node:
        return False
    db.delete(node)
    db.commit()
    return True


def move_node_any(db: Session, node_id: int, direction: str) -> Optional[RBSNode]:
    """Move any RBS node (for managers/admins)"""
    node = db.get(RBSNode, node_id)
    if not node:
        return None
    # Get siblings ordered by order_index
    siblings = list(
        db.scalars(
            select(RBSNode)
            .where(RBSNode.parent_id == node.parent_id)
            .order_by(RBSNode.order_index, RBSNode.id)
        )
    )
    # Normalize order_index to unique sequential values if duplicates exist
    seen = set()
    duplicates = False
    for s in siblings:
        key = s.order_index
        if key in seen:
            duplicates = True
            break
        seen.add(key)
    if duplicates or any((s.order_index or 0) < 1 for s in siblings):
        for idx, s in enumerate(siblings, start=1):
            s.order_index = idx
        db.flush()
    try:
        idx = next(i for i, s in enumerate(siblings) if s.id == node.id)
    except StopIteration:
        return node
    if direction == "up" and idx > 0:
        prev = siblings[idx - 1]
        node.order_index, prev.order_index = prev.order_index, node.order_index
    elif direction == "down" and idx < len(siblings) - 1:
        nxt = siblings[idx + 1]
        node.order_index, nxt.order_index = nxt.order_index, node.order_index
    else:
        return node
    db.commit()
    db.refresh(node)
    return node


