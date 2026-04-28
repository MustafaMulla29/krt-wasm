//! Grid-based A* PCB Router - Rust implementation for speed.
//!
//! This is a high-performance implementation of the grid router algorithm.
//! It's designed to be called from Python via PyO3 bindings.

#[cfg(feature = "python")]
use pyo3::prelude::*;

#[cfg(feature = "python")]
mod dubins;
mod obstacle_map;
#[cfg(feature = "python")]
mod pose_router;
mod router;
mod types;
#[cfg(feature = "python")]
mod visual_router;
#[cfg(feature = "wasm")]
mod wasm;

#[cfg(feature = "python")]
pub use obstacle_map::GridObstacleMap;
#[cfg(feature = "python")]
pub use pose_router::PoseRouter;
#[cfg(feature = "python")]
pub use router::GridRouter;
#[cfg(feature = "python")]
pub use visual_router::{SearchSnapshot, VisualRouter};
#[cfg(feature = "wasm")]
pub use wasm::route_simple_route_json;

/// Try to release unused memory back to the OS.
/// This is a hint to the allocator and may not have immediate effect.
#[cfg(feature = "python")]
#[pyfunction]
fn release_memory() {
    // On most platforms, dropping collections and calling shrink_to_fit
    // is the main way to release memory. The Rust allocator will
    // eventually return memory to the OS when possible.
    //
    // For more aggressive memory release on Linux, one could use:
    // unsafe { libc::malloc_trim(0); }
    // But this requires the libc crate and is platform-specific.
    //
    // For now, this function serves as a documentation point and
    // placeholder for future platform-specific optimizations.
}

/// Python module
#[cfg(feature = "python")]
#[pymodule]
fn grid_router(m: &Bound<'_, PyModule>) -> PyResult<()> {
    m.add("__version__", env!("CARGO_PKG_VERSION"))?;
    m.add_class::<GridObstacleMap>()?;
    m.add_class::<GridRouter>()?;
    m.add_class::<PoseRouter>()?;
    m.add_class::<VisualRouter>()?;
    m.add_class::<SearchSnapshot>()?;
    m.add_function(wrap_pyfunction!(release_memory, m)?)?;
    Ok(())
}
