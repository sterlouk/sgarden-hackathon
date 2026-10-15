const capitalize = (s = "") => s && s.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");

export default capitalize;
