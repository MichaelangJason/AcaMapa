"use client";

import AppActions from "./AppActions";
import UserUtilities from "./UserUtilities";

const UtilityBar = () => {
  return (
    <section className="utility-bar">
      <AppActions />
      <UserUtilities />
    </section>
  );
};

export default UtilityBar;
