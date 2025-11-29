import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, Plus } from "lucide-react";
import { toast } from "sonner";
import { User } from "@supabase/supabase-js";
import { BackButton } from "@/components/navigation/BackButton";
// NEW: icons for tree UI
import { ChevronRight, ChevronDown, CheckCircle2, Search } from "lucide-react";

interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  status: string;
  votes: number;
}

// NEW: DSA tree types and data
type DsaDifficulty = "Easy" | "Medium" | "Hard";
interface DsaNode {
  id: string;
  title: string;
  difficulty: DsaDifficulty;
  children?: DsaNode[];
}

const DSA_TREE: DsaNode[] = [
  {
    id: "arrays-strings",
    title: "Arrays & Strings",
    difficulty: "Easy",
    children: [
      { id: "two-pointers", title: "Two Pointers", difficulty: "Easy" },
      { id: "sliding-window", title: "Sliding Window", difficulty: "Medium" },
      { id: "prefix-sums", title: "Prefix / Suffix Sums", difficulty: "Medium" },
    ],
  },
  {
    id: "hashing",
    title: "Hashing",
    difficulty: "Easy",
    children: [
      { id: "hashmap-set", title: "HashMap / HashSet Patterns", difficulty: "Easy" },
      { id: "frequency-table", title: "Frequency Tables", difficulty: "Easy" },
      { id: "anagrams", title: "Grouping Anagrams", difficulty: "Medium" },
    ],
  },
  {
    id: "stack-queue",
    title: "Stack & Queue",
    difficulty: "Medium",
    children: [
      { id: "monotonic-stack", title: "Monotonic Stack", difficulty: "Medium" },
      { id: "min-stack", title: "Min Stack", difficulty: "Easy" },
      { id: "bfs-queue", title: "BFS with Queue", difficulty: "Medium" },
    ],
  },
  {
    id: "linked-list",
    title: "Linked List",
    difficulty: "Medium",
    children: [
      { id: "fast-slow", title: "Fast & Slow Pointers", difficulty: "Medium" },
      { id: "reverse-list", title: "Reverse Linked List", difficulty: "Easy" },
      { id: "detect-cycle", title: "Cycle Detection", difficulty: "Medium" },
    ],
  },
  {
    id: "trees",
    title: "Trees",
    difficulty: "Medium",
    children: [
      { id: "dfs-recursion", title: "DFS & Recursion", difficulty: "Medium" },
      { id: "bfs-levelorder", title: "BFS Level Order", difficulty: "Medium" },
      { id: "bst", title: "Binary Search Tree (BST)", difficulty: "Medium" },
    ],
  },
  {
    id: "graphs",
    title: "Graphs",
    difficulty: "Hard",
    children: [
      { id: "graph-dfs-bfs", title: "DFS/BFS on Graphs", difficulty: "Medium" },
      { id: "topo-sort", title: "Topological Sort (DAG)", difficulty: "Medium" },
      { id: "shortest-path", title: "Shortest Path (Dijkstra/Bellman-Ford)", difficulty: "Hard" },
      { id: "union-find", title: "Union-Find (Disjoint Set)", difficulty: "Medium" },
    ],
  },
  {
    id: "dp",
    title: "Dynamic Programming",
    difficulty: "Hard",
    children: [
      { id: "1d-dp", title: "1D DP (Fibonacci, House Robber)", difficulty: "Medium" },
      { id: "2d-grid-dp", title: "2D / Grid DP", difficulty: "Hard" },
      { id: "knapsack", title: "Knapsack Patterns", difficulty: "Hard" },
      { id: "lis", title: "Longest Increasing Subsequence", difficulty: "Hard" },
    ],
  },
  {
    id: "greedy",
    title: "Greedy",
    difficulty: "Medium",
    children: [
      { id: "intervals", title: "Intervals & Scheduling", difficulty: "Medium" },
      { id: "sorting-greedy", title: "Sorting-based Greedy", difficulty: "Easy" },
    ],
  },
  {
    id: "backtracking",
    title: "Backtracking",
    difficulty: "Medium",
    children: [
      { id: "subsets", title: "Subsets / Combinations", difficulty: "Medium" },
      { id: "permutations", title: "Permutations", difficulty: "Medium" },
      { id: "n-queens", title: "N-Queens", difficulty: "Hard" },
    ],
  },
];

// Helpers to flatten and count nodes
const collectAllIds = (nodes: DsaNode[]): string[] => {
  const out: string[] = [];
  const dfs = (n: DsaNode) => {
    out.push(n.id);
    (n.children || []).forEach(dfs);
  };
  nodes.forEach(dfs);
  return out;
};
const ALL_DSA_IDS = collectAllIds(DSA_TREE);

const DSA_COMPLETED_KEY = "dsa.tree.completed.v1";
const DSA_EXPANDED_KEY = "dsa.tree.expanded.v1";

const Roadmap = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set());
  const [showSuggestionForm, setShowSuggestionForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");

  // NEW: DSA tree UI state
  const [treeQuery, setTreeQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [doneNodes, setDoneNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    checkAuth();
    loadRoadmapItems();
  }, []);

  // Load persisted DSA state
  useEffect(() => {
    try {
      const e = localStorage.getItem(DSA_EXPANDED_KEY);
      const d = localStorage.getItem(DSA_COMPLETED_KEY);
      if (e) setExpanded(new Set(JSON.parse(e)));
      if (d) setDoneNodes(new Set(JSON.parse(d)));
    } catch {}
  }, []);

  // Persist DSA state
  useEffect(() => {
    try {
      localStorage.setItem(DSA_EXPANDED_KEY, JSON.stringify(Array.from(expanded)));
      localStorage.setItem(DSA_COMPLETED_KEY, JSON.stringify(Array.from(doneNodes)));
    } catch {}
  }, [expanded, doneNodes]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      loadUserVotes(user.id);
    }
  };

  const loadRoadmapItems = async () => {
    try {
      const { data, error } = await supabase
        .from("roadmap_items")
        .select("*")
        .order("votes", { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Error loading roadmap:", error);
      toast.error("Failed to load roadmap");
    }
  };

  const loadUserVotes = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("roadmap_votes")
        .select("item_id")
        .eq("user_id", userId);

      if (error) throw error;
      setUserVotes(new Set(data?.map((v) => v.item_id) || []));
    } catch (error) {
      console.error("Error loading votes:", error);
    }
  };

  const handleVote = async (itemId: string) => {
    if (!user) {
      toast.error("Please log in to vote");
      return;
    }

    try {
      if (userVotes.has(itemId)) {
        const { error } = await supabase
          .from("roadmap_votes")
          .delete()
          .eq("user_id", user.id)
          .eq("item_id", itemId);

        if (error) throw error;
        
        await supabase.rpc("decrement_roadmap_votes" as any, { item_id: itemId });
        
        const newVotes = new Set(userVotes);
        newVotes.delete(itemId);
        setUserVotes(newVotes);
      } else {
        const { error } = await supabase
          .from("roadmap_votes")
          .insert({ user_id: user.id, item_id: itemId });

        if (error) throw error;
        
        await supabase.rpc("increment_roadmap_votes" as any, { item_id: itemId });
        
        setUserVotes(new Set([...userVotes, itemId]));
      }

      loadRoadmapItems();
      toast.success("Vote updated!");
    } catch (error) {
      console.error("Error voting:", error);
      toast.error("Failed to update vote");
    }
  };

  const handleSubmitSuggestion = async () => {
    if (!user) {
      toast.error("Please log in to submit suggestions");
      return;
    }

    if (!newTitle.trim() || !newDescription.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const { error } = await supabase
        .from("roadmap_items")
        .insert({
          title: newTitle,
          description: newDescription,
          status: "planned",
          created_by: user.id,
        });

      if (error) throw error;

      toast.success("Suggestion submitted!");
      setNewTitle("");
      setNewDescription("");
      setShowSuggestionForm(false);
      loadRoadmapItems();
    } catch (error) {
      console.error("Error submitting suggestion:", error);
      toast.error("Failed to submit suggestion");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "planned": return "bg-blue-500";
      case "in_progress": return "bg-yellow-500";
      case "released": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "in_progress": return "In Progress";
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const groupedItems = {
    planned: items.filter((i) => i.status === "planned"),
    in_progress: items.filter((i) => i.status === "in_progress"),
    released: items.filter((i) => i.status === "released"),
  };

  // NEW: DSA tree helpers
  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleDone = (id: string) => {
    setDoneNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const expandAll = () => setExpanded(new Set(ALL_DSA_IDS));
  const collapseAll = () => setExpanded(new Set());

  const totalDsa = ALL_DSA_IDS.length;
  const doneDsa = doneNodes.size;
  const dsaPct = Math.round((doneDsa / Math.max(1, totalDsa)) * 100);

  const matchesQuery = (node: DsaNode, q: string) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return (
      node.title.toLowerCase().includes(s) ||
      node.id.toLowerCase().includes(s)
    );
  };
  const hasDescendantMatch = (node: DsaNode, q: string): boolean => {
    if (matchesQuery(node, q)) return true;
    return (node.children || []).some((c) => hasDescendantMatch(c, q));
  };

  const TreeNode = ({ node, level = 0 }: { node: DsaNode; level?: number }) => {
    const hasChildren = !!(node.children && node.children.length);
    const isExpanded = expanded.has(node.id);
    const showByQuery = treeQuery
      ? hasDescendantMatch(node, treeQuery)
      : true;

    if (!showByQuery) return null;

    return (
      <div className="select-none">
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2">
            <div style={{ width: level * 16 }} />
            {hasChildren ? (
              <button
                onClick={() => toggleExpand(node.id)}
                className="p-1 rounded hover:bg-muted"
                aria-label={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-foreground" />
                )}
              </button>
            ) : (
              <div style={{ width: 28 }} />
            )}
            <span className="text-sm text-foreground font-medium">{node.title}</span>
            <Badge variant="outline" className="text-xs">
              {node.difficulty}
            </Badge>
          </div>
          <Button
            size="sm"
            variant={doneNodes.has(node.id) ? "default" : "outline"}
            onClick={() => toggleDone(node.id)}
            className={doneNodes.has(node.id) ? "bg-green-600 hover:bg-green-600/90" : ""}
            aria-pressed={doneNodes.has(node.id)}
          >
            <CheckCircle2 className="w-4 h-4 mr-1" />
            {doneNodes.has(node.id) ? "Done" : "Mark"}
          </Button>
        </div>
        {hasChildren && isExpanded && (
          <div className="pl-6">
            {node.children!.map((c) => (
              <TreeNode key={c.id} node={c} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton />
            <h1 className="text-2xl font-bold text-foreground">Roadmap & Changelog</h1>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowSuggestionForm(!showSuggestionForm)} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Suggest Feature
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {showSuggestionForm && (
          <Card className="p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 text-foreground">Suggest a Feature</h2>
            <div className="space-y-4">
              <Input
                placeholder="Feature title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
              <Textarea
                placeholder="Feature description"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={4}
              />
              <div className="flex gap-2">
                <Button onClick={handleSubmitSuggestion}>Submit</Button>
                <Button variant="outline" onClick={() => setShowSuggestionForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {Object.entries(groupedItems).map(([status, statusItems]) => (
            <div key={status}>
              <h2 className="text-xl font-semibold mb-4 text-foreground capitalize">
                {getStatusLabel(status)}
              </h2>
              <div className="space-y-4">
                {statusItems.map((item) => (
                  <Card key={item.id} className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-foreground">{item.title}</h3>
                      <Badge className={getStatusColor(item.status)}>
                        {getStatusLabel(item.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleVote(item.id)}
                      className={userVotes.has(item.id) ? "bg-accent" : ""}
                      aria-label={`Vote for ${item.title}`}
                    >
                      <ThumbsUp className="w-4 h-4 mr-2" />
                      {item.votes}
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* NEW: DSA Topic Tree */}
        <Card className="p-6 mt-8">
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 mb-4">
            <h2 className="text-xl font-semibold text-foreground flex-1">DSA Topic Tree</h2>
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={treeQuery}
                onChange={(e) => setTreeQuery(e.target.value)}
                placeholder="Search topics..."
                className="pl-9"
                aria-label="Search DSA topics"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={expandAll}>Expand all</Button>
              <Button variant="outline" size="sm" onClick={collapseAll}>Collapse all</Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDoneNodes(new Set())}
                aria-label="Reset DSA progress"
              >
                Reset progress
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-4 text-sm text-muted-foreground">
            <span>{doneDsa} / {totalDsa} completed</span>
            <div className="flex-1 h-2 bg-muted rounded overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${dsaPct}%` }} />
            </div>
            <span className="tabular-nums">{dsaPct}%</span>
          </div>

          <div className="divide-y divide-border">
            {DSA_TREE.map((node) => (
              <TreeNode key={node.id} node={node} />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Roadmap;
