from __future__ import annotations

from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models.rbs import RBSNode


def list_nodes(db: Session, owner_id: int) -> List[RBSNode]:
    stmt = select(RBSNode).where(RBSNode.owner_id == owner_id).order_by(RBSNode.parent_id, RBSNode.order_index)
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


def create_node(db: Session, owner_id: int, **data) -> RBSNode:
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


