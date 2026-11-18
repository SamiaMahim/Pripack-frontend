import PropTypes from 'prop-types';

// Text label shown under a header icon on hover. Parent needs `relative group/nav`.
const NavLabel = ({ children }) => (
  <span className="pointer-events-none absolute left-1/2 top-full -translate-x-1/2 mt-0.5 whitespace-nowrap text-[11px] font-medium text-teal-600 opacity-0 group-hover/nav:opacity-100 transition-opacity">
    {children}
  </span>
);

NavLabel.propTypes = {
  children: PropTypes.node.isRequired,
};

export default NavLabel;
