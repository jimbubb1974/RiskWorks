import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listRBSTree,
  createRBSNode,
  updateRBSNode,
  deleteRBSNode,
  type RBSNode,
} from "../services/rbs";
import { useState } from "react";
import {
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { moveRBSNode } from "../services/rbs";

export default function RBSPage() {
  const queryClient = useQueryClient();
  const { data: nodes = [], isLoading } = useQuery({
    queryKey: ["rbs-tree"],
    queryFn: listRBSTree,
  });

  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const toggle = (id: number) => setExpanded((s) => ({ ...s, [id]: !s[id] }));

  const createMut = useMutation({
    mutationFn: createRBSNode,
    onSuccess: (_data, variables) => {
      if (
        variables &&
        typeof variables === "object" &&
        "parent_id" in variables &&
        variables.parent_id
      ) {
        setExpanded((s) => ({ ...s, [variables.parent_id as number]: true }));
      }
      queryClient.invalidateQueries({ queryKey: ["rbs-tree"] });
    },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<RBSNode> }) =>
      updateRBSNode(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rbs-tree"] }),
  });
  const deleteMut = useMutation({
    mutationFn: deleteRBSNode,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rbs-tree"] }),
  });

  const moveMut = useMutation({
    mutationFn: ({ id, direction }: { id: number; direction: "up" | "down" }) =>
      moveRBSNode(id, direction),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rbs-tree"] }),
  });

  const addRoot = () =>
    createMut.mutate({
      name: "New Category",
      description: "",
      parent_id: null,
    });

  return (
    <div className="space-y-4">
      <div className="card flex items-center justify-between py-3">
        <h3 className="font-semibold text-secondary-900">
          Risk Breakdown Structure
        </h3>
        <button className="btn-primary" onClick={addRoot}>
          <Plus className="w-4 h-4 mr-2" /> Add Root Category
        </button>
      </div>

      <div className="card py-3">
        {isLoading ? (
          <div className="text-secondary-600 py-2">Loading RBS...</div>
        ) : nodes.length === 0 ? (
          <div className="text-secondary-600 py-2">
            No categories yet. Create your first root category.
          </div>
        ) : (
          <div className="space-y-1">
            {nodes.map((n) => (
              <RBSNodeItem
                key={n.id}
                node={n}
                level={0}
                expanded={expanded}
                onToggle={toggle}
                onUpdate={updateMut.mutate}
                onDelete={deleteMut.mutate}
                onCreateChild={(parentId) =>
                  createMut.mutate({
                    name: "New Category",
                    description: "",
                    parent_id: parentId,
                  })
                }
                onMove={(id, direction) => moveMut.mutate({ id, direction })}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RBSNodeItem({
  node,
  level,
  expanded,
  onToggle,
  onUpdate,
  onDelete,
  onCreateChild,
  onMove,
}: {
  node: RBSNode & { children?: RBSNode[] };
  level: number;
  expanded: Record<number, boolean>;
  onToggle: (id: number) => void;
  onUpdate: (args: { id: number; payload: Partial<RBSNode> }) => void;
  onDelete: (id: number) => void;
  onCreateChild: (parentId: number) => void;
  onMove: (id: number, direction: "up" | "down") => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(node.name);
  const [description, setDescription] = useState(node.description || "");

  const save = () => {
    onUpdate({ id: node.id, payload: { name, description } });
    setEditing(false);
  };

  const hasChildren = (node.children?.length || 0) > 0;
  const isOpen = expanded[node.id] ?? true;

  return (
    <div className="rounded-lg border border-secondary-200">
      <div className="flex items-center justify-between p-2">
        <div className="flex items-center gap-2">
          <button
            className="btn-ghost p-1"
            onClick={() =>
              hasChildren ? onToggle(node.id) : onCreateChild(node.id)
            }
            title={hasChildren ? (isOpen ? "Collapse" : "Expand") : "Add child"}
          >
            {hasChildren ? (
              isOpen ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </button>
          {editing ? (
            <input
              className="input text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          ) : (
            <div
              className="font-medium text-sm"
              style={{ marginLeft: level * 8 }}
            >
              {node.name}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          {editing ? (
            <>
              <button className="btn-primary text-sm px-2 py-1" onClick={save}>
                <Save className="w-3 h-3 mr-1" /> Save
              </button>
              <button
                className="btn-secondary text-sm px-2 py-1"
                onClick={() => setEditing(false)}
              >
                <X className="w-3 h-3 mr-1" /> Cancel
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1">
                <button
                  className="btn-ghost p-1"
                  title="Move up"
                  onClick={() => onMove(node.id, "up")}
                >
                  <ChevronUp className="w-3 h-3" />
                </button>
                <button
                  className="btn-ghost p-1"
                  title="Move down"
                  onClick={() => onMove(node.id, "down")}
                >
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>
              <button
                className="btn-secondary text-sm px-2 py-1"
                onClick={() => setEditing(true)}
              >
                <Edit3 className="w-3 h-3 mr-1" /> Edit
              </button>
              <button
                className="btn-danger text-sm px-2 py-1"
                onClick={() => onDelete(node.id)}
              >
                <Trash2 className="w-3 h-3 mr-1" /> Delete
              </button>
              <button
                className="btn-secondary text-sm px-2 py-1"
                onClick={() => onCreateChild(node.id)}
              >
                <Plus className="w-3 h-3 mr-1" /> Add Child
              </button>
            </>
          )}
        </div>
      </div>
      {editing && (
        <div className="p-2">
          <textarea
            className="input text-sm"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </div>
      )}
      {hasChildren && isOpen && (
        <div className="pl-4 pb-2 space-y-1">
          {node.children!.map((child) => (
            <RBSNodeItem
              key={child.id}
              node={child}
              level={level + 1}
              expanded={expanded}
              onToggle={onToggle}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onCreateChild={onCreateChild}
              onMove={onMove}
            />
          ))}
        </div>
      )}
    </div>
  );
}
