import React from "react";
import { Link } from "react-router-dom";

interface BackButtonProps {
  classNames?: string;
}

const BackButton = ({ classNames }: BackButtonProps): React.ReactNode => {
  return (
    <Link
      to="/workouts"
      className={`flex items-center justify-between ${classNames}`}
    >
      <i className="fa-solid fa-chevron-left text-2xl"></i>
    </Link>
  );
};

export default BackButton;
