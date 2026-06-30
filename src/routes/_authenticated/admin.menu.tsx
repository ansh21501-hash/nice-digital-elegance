import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageTitle } from "@/components/admin/AdminShell";
import { ResourceManager, StatusBadge, type Field, type Column } from "@/components/admin/ResourceManager";
import { useRows } from "@/lib/admin/data";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/admin/menu")({ component: Menu });

const categoryFields: Field[] = [
  { name: "name", label: "Category Name", type: "text", required: true },
  { name: "sort_order", label: "Sort Order", type: "number", default: 0 },
  { name: "is_active", label: "Active", type: "boolean", default: true },
];

const categoryColumns: Column[] = [
  { name: "name", label: "Category" },
  { name: "sort_order", label: "Order" },
  { name: "is_active", label: "Active", render: (r) => r.is_active ? "Yes" : "No" },
];

function Menu() {
  const { data: cats = [] } = useRows<any>("menu_categories", { orderBy: "sort_order", ascending: true });
  const [tab, setTab] = useState("items");

  const itemFields: Field[] = [
    { name: "name", label: "Dish Name", type: "text", required: true },
    { name: "category_id", label: "Category", type: "select", options: cats.map((c) => ({ value: c.id, label: c.name })) },
    { name: "price", label: "Price (e.g. ₹120)", type: "text" },
    { name: "is_veg", label: "Vegetarian", type: "boolean", default: true },
    { name: "is_available", label: "Available", type: "boolean", default: true },
    { name: "badges", label: "Badges", type: "tags" },
    { name: "sort_order", label: "Sort Order", type: "number", default: 0 },
    { name: "image", label: "Dish Image", type: "image", fullWidth: true },
    { name: "description", label: "Description", type: "textarea" },
  ];
  const itemColumns: Column[] = [
    { name: "name", label: "Dish", render: (r) => <div><p className="font-medium">{r.name}</p><p className="text-xs text-muted-foreground">{cats.find((c) => c.id === r.category_id)?.name || "—"}</p></div> },
    { name: "price", label: "Price", render: (r) => r.price || "—" },
    { name: "is_veg", label: "Type", render: (r) => <span className={r.is_veg ? "text-[#2E7D32]" : "text-[#C62828]"}>{r.is_veg ? "Veg" : "Non-veg"}</span> },
    { name: "badges", label: "Badges", render: (r) => Array.isArray(r.badges) && r.badges.length ? <StatusBadge value={r.badges[0]} /> : "—" },
    { name: "is_available", label: "Available", render: (r) => r.is_available ? "Yes" : "No" },
  ];

  return (
    <div>
      <PageTitle title="Restaurant & Menu Builder" subtitle="Categories, dishes, pricing & badges" />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="items">Menu Items</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>
        <TabsContent value="items">
          <ResourceManager table="menu_items" fields={itemFields} columns={itemColumns} orderBy="sort_order" ascending searchKeys={["name", "description"]} />
        </TabsContent>
        <TabsContent value="categories">
          <ResourceManager table="menu_categories" fields={categoryFields} columns={categoryColumns} orderBy="sort_order" ascending searchKeys={["name"]} />
        </TabsContent>
      </Tabs>
    </div>
  );
}