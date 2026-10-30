import { dynamicStyles } from "../../tailwindStyles.js";

const sizes = {
  sm: "[width:21px] [height:21px] [font-size:7px]",
  md: "[width:27px] [height:27px] [font-size:9px]",
  lg: "[width:44px] [height:44px] [font-size:13px]",
};

export default function Avatar({
  name = "",
  color = "coral",
  size = "md",
  className = "",
  as: Element = "span",
  ...props
}) {
  return (
    <Element
      className={`inline-grid place-items-center [border-radius:50%] font-bold shrink-0 ${sizes[size]} ${dynamicStyles.avatar[color]} ${className}`.trim()}
      {...props}
    >
      {name.slice(0, 2).toUpperCase() || "?"}
    </Element>
  );
}
