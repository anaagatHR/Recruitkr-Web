"use client";

// Thin re-export kept for backwards compatibility. The shim's NavLink already
// supports `className` as a string or an `({ isActive }) => string` function.
import { NavLink } from "@/compat/router";

export { NavLink };
export default NavLink;
