import Skeleton from "react-loading-skeleton";
import { SKELETON_CONFIG } from "@/lib/constants";

const ItemTagSkeleton = ({ width = "1" }: { width?: "1" | "2" }) => {
  return (
    <Skeleton
      width={
        width === "1"
          ? SKELETON_CONFIG.ITEM_TAG.WIDTH_1
          : SKELETON_CONFIG.ITEM_TAG.WIDTH_2
      }
      height={SKELETON_CONFIG.ITEM_TAG.HEIGHT}
      borderRadius={SKELETON_CONFIG.ITEM_TAG.RADIUS}
    />
  );
};

export default ItemTagSkeleton;
