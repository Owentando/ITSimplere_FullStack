import { useRef, useState, useEffect } from "react";

function Whiteboard({ content, onChange }) {

    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState("#000000");
    const [strokeWidth, setStrokeWidth] = useState(3);
    const [isErasing, setIsErasing] = useState(false);
    const [tool, setTool] = useState("draw");
    const [selectedShapeIndex, setSelectedShapeIndex] = useState(null);
    const [shapes, setShapes] = useState([]);
    const isInitialRender = useRef(true);
    const isReceivingContent = useRef(false);

    useEffect(() => {
    if (!content) {
        if (shapes.length > 0) {
            isReceivingContent.current = true;
            setShapes([]);
        }
        return;
    }

    try {
        const savedShapes = JSON.parse(content);

        if (Array.isArray(savedShapes)) {
            if (JSON.stringify(shapes) !== content) {
                isReceivingContent.current = true;
                setShapes(savedShapes);
            }
        } else {
            if (shapes.length > 0) {
                isReceivingContent.current = true;
                setShapes([]);
            }
        }
    } catch (error) {
        console.error("Could not load whiteboard shapes:", error);
    }
}, [content]);

    useEffect(() => {
    if (isInitialRender.current) {
        isInitialRender.current = false;
        return;
    }

    if (isReceivingContent.current) {
        isReceivingContent.current = false;
        return;
    }

    onChange(JSON.stringify(shapes));
}, [shapes]);

    const [redoStack, setRedoStack] = useState([]);
    const [textInput, setTextInput] = useState("");
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const startPosition = useRef({ x: 0, y: 0 });
    const panStart = useRef({ x: 0, y: 0 });
    const currentStroke = useRef([]);
    const dragStart = useRef({ x: 0, y: 0 });
    const resizeHandle = useRef(null);
    const handleSize = 8;


    useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
        return;
    }

    const context = canvas.getContext("2d");

    // Clear the canvas before redrawing
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Redraw every stored shape
        shapes.forEach((shape, index) => {
        context.strokeStyle = shape.color;
        context.lineWidth = shape.strokeWidth;
        context.lineCap = "round";

        if (shape.type === "rectangle") {
            context.strokeRect(
                shape.x,
                shape.y,
                shape.width,
                shape.height
            );
        }

        else if (shape.type === "circle") {
            context.beginPath();

            context.arc(
                shape.x,
                shape.y,
                shape.radius,
                0,
                2 * Math.PI
            );

            context.stroke();
        }

        else if (shape.type === "arrow") {
            const angle = Math.atan2(
                shape.endY - shape.startY,
                shape.endX - shape.startX
            );

            const headLength = 12;

            context.beginPath();
            context.moveTo(shape.startX, shape.startY);
            context.lineTo(shape.endX, shape.endY);
            context.stroke();

            context.beginPath();
            context.moveTo(shape.endX, shape.endY);

            context.lineTo(
                shape.endX - headLength * Math.cos(angle - Math.PI / 6),
                shape.endY - headLength * Math.sin(angle - Math.PI / 6)
            );

            context.moveTo(shape.endX, shape.endY);

            context.lineTo(
                shape.endX - headLength * Math.cos(angle + Math.PI / 6),
                shape.endY - headLength * Math.sin(angle + Math.PI / 6)
            );

            context.stroke();
        }

        else if (shape.type === "freehand") {
            if (shape.points.length > 0) {
                context.beginPath();

                context.moveTo(
                    shape.points[0].x,
                    shape.points[0].y
                );

                shape.points.forEach(point => {
                    context.lineTo(point.x, point.y);
                });

                context.stroke();
            }
        }

        else if (shape.type === "text") {
                context.fillStyle = shape.color;
                context.font = `${shape.fontSize}px Arial`;

                context.fillText(
                shape.text,
                shape.x,
                shape.y
    );
}

if (index === selectedShapeIndex) {
    context.save();
    context.strokeStyle = "orange";
    context.lineWidth = 2;
    context.setLineDash([5, 5]);

    if (shape.type === "rectangle") {
        context.strokeRect(
            shape.x - 5,
            shape.y - 5,
            shape.width + 10,
            shape.height + 10
        );
        context.fillStyle = "blue";

context.fillRect(
    shape.x - handleSize / 2,
    shape.y - handleSize / 2,
    handleSize,
    handleSize
);

context.fillRect(
    shape.x + shape.width - handleSize / 2,
    shape.y - handleSize / 2,
    handleSize,
    handleSize
);

context.fillRect(
    shape.x - handleSize / 2,
    shape.y + shape.height - handleSize / 2,
    handleSize,
    handleSize
);

context.fillRect(
    shape.x + shape.width - handleSize / 2,
    shape.y + shape.height - handleSize / 2,
    handleSize,
    handleSize
);

// Top middle
context.fillRect(
    shape.x + shape.width / 2 - handleSize / 2,
    shape.y - handleSize / 2,
    handleSize,
    handleSize
);

// Bottom middle
context.fillRect(
    shape.x + shape.width / 2 - handleSize / 2,
    shape.y + shape.height - handleSize / 2,
    handleSize,
    handleSize
);

// Left middle
context.fillRect(
    shape.x - handleSize / 2,
    shape.y + shape.height / 2 - handleSize / 2,
    handleSize,
    handleSize
);

// Right middle
context.fillRect(
    shape.x + shape.width - handleSize / 2,
    shape.y + shape.height / 2 - handleSize / 2,
    handleSize,
    handleSize
);
    }

    else if (shape.type === "circle") {
        context.beginPath();
        context.arc(
            shape.x,
            shape.y,
            shape.radius + 5,
            0,
            2 * Math.PI
        );
        context.stroke();

        context.fillStyle = "blue";

context.fillRect(
    shape.x + shape.radius - handleSize / 2,
    shape.y - handleSize / 2,
    handleSize,
    handleSize
);
    }

    else if (shape.type === "arrow") {
        const minX = Math.min(shape.startX, shape.endX);
        const minY = Math.min(shape.startY, shape.endY);
        const width = Math.abs(shape.endX - shape.startX);
        const height = Math.abs(shape.endY - shape.startY);

        context.strokeRect(
            minX - 5,
            minY - 5,
            width + 10,
            height + 10
        );
    }

    else if (shape.type === "freehand" && shape.points.length > 0) {
    const xValues = shape.points.map(point => point.x);
    const yValues = shape.points.map(point => point.y);

    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const minY = Math.min(...yValues);
    const maxY = Math.max(...yValues);

    context.strokeRect(
        minX - 5,
        minY - 5,
        maxX - minX + 10,
        maxY - minY + 10
    );
}

else if (shape.type === "text") {
    context.font = `${shape.fontSize}px Arial`;

    const textWidth = context.measureText(shape.text).width;
    const textHeight = shape.fontSize;

    context.strokeRect(
        shape.x - 5,
        shape.y - textHeight - 5,
        textWidth + 10,
        textHeight + 10
    );

    context.fillStyle = "blue";

    context.fillRect(
        shape.x + textWidth + 5 - handleSize / 2,
        shape.y - textHeight - 5 - handleSize / 2,
        handleSize,
        handleSize
    );
}


    context.restore();
}
    });

}, [shapes, selectedShapeIndex]);

    //startDrawing function
function startDrawing(event) {
    const canvas = canvasRef.current;
    const selectedShape = shapes[selectedShapeIndex];
    const rect = canvas.getBoundingClientRect();

    const x = (event.clientX - rect.left) / zoom;
    const y = (event.clientY - rect.top) / zoom;

    if (tool === "select") {

    if (selectedShapeIndex !== null) {

        if (selectedShape && selectedShape.type === "rectangle") {
            const corners = [
                { name: "top-left", x: selectedShape.x, y: selectedShape.y },
                { name: "top-right", x: selectedShape.x + selectedShape.width, y: selectedShape.y },
                { name: "bottom-left", x: selectedShape.x, y: selectedShape.y + selectedShape.height },
                { name: "bottom-right", x: selectedShape.x + selectedShape.width, y: selectedShape.y + selectedShape.height },
                { name: "top-middle", x: selectedShape.x + selectedShape.width / 2, y: selectedShape.y },
                { name: "bottom-middle", x: selectedShape.x + selectedShape.width / 2, y: selectedShape.y + selectedShape.height },
                { name: "left-middle", x: selectedShape.x, y: selectedShape.y + selectedShape.height / 2 },
                { name: "right-middle", x: selectedShape.x + selectedShape.width, y: selectedShape.y + selectedShape.height / 2 }
            ];

        const clickedHandle = corners.find(corner =>
            Math.abs(x - corner.x) <= handleSize &&
            Math.abs(y - corner.y) <= handleSize
        );

        if (clickedHandle) {
            resizeHandle.current = clickedHandle.name;
            dragStart.current = { x, y };
            setIsDrawing(true);
            return;
        }
    }

        if (selectedShape && selectedShape.type === "circle") {
        const handleX = selectedShape.x + selectedShape.radius;
        const handleY = selectedShape.y;

        if (
            Math.abs(x - handleX) <= handleSize &&
            Math.abs(y - handleY) <= handleSize
    ) {
            resizeHandle.current = "circle";
            dragStart.current = { x, y };
            setIsDrawing(true);
            return;
     }
}
}

        if (selectedShape && selectedShape.type === "text") {
    const context = canvas.getContext("2d");

    context.font = `${selectedShape.fontSize}px Arial`;

    const textWidth = context.measureText(selectedShape.text).width;

    const handleX = selectedShape.x + textWidth + 5;
    const handleY = selectedShape.y - selectedShape.fontSize - 5;

    if (
        Math.abs(x - handleX) <= handleSize &&
        Math.abs(y - handleY) <= handleSize
    ) {
        resizeHandle.current = "text";
        dragStart.current = { x, y };
        setIsDrawing(true);
        return;
    }
}

            const clickedShapeIndex = shapes.findIndex(shape => {

        if (shape.type === "rectangle") {
            return (
                x >= Math.min(shape.x, shape.x + shape.width) &&
                x <= Math.max(shape.x, shape.x + shape.width) &&
                y >= Math.min(shape.y, shape.y + shape.height) &&
                y <= Math.max(shape.y, shape.y + shape.height)
            );
        }

        if (shape.type === "circle") {
            const distance = Math.sqrt(
                Math.pow(x - shape.x, 2) +
                Math.pow(y - shape.y, 2)
            );

            return distance <= shape.radius;
        }

        if (shape.type === "arrow") {
            const distance = Math.sqrt(
                Math.pow(x - shape.endX, 2) +
                Math.pow(y - shape.endY, 2)
        );

    return distance <= 15;
}

        if (shape.type === "text") {
            const textWidth = shape.text.length * 12;

            return (
                x >= shape.x &&
                x <= shape.x + textWidth &&
                y >= shape.y - shape.fontSize &&
                y <= shape.y
        );
}

        if (shape.type === "freehand") {
            return shape.points.some(point => {
                const distance = Math.sqrt(
                    Math.pow(x - point.x, 2) +
                    Math.pow(y - point.y, 2)
        );

        return distance <= 10;
    });
}

        return false;
    });

    setSelectedShapeIndex(
        clickedShapeIndex === -1 ? null : clickedShapeIndex  
    );

    if (clickedShapeIndex !== -1) {
    dragStart.current = { x, y };
    setIsDrawing(true);
}

    return;
}

    if (tool === "pan") {
    panStart.current = {
        x: event.clientX,
        y: event.clientY,
        panX: pan.x,
        panY: pan.y
    };

    setIsDrawing(true);
    return;
}

    if (tool === "text") {
    if (textInput.trim() === "") {
        return;
    }

    const newShape = {
        type: "text",
        text: textInput,
        x: x,
        y: y,
        color: color,
        fontSize: 20
    };

    setShapes(previousShapes => [
        ...previousShapes,
        newShape
    ]);

    setTextInput("");
    return;
}

    if (tool === "rectangle" || tool === "circle" ||
    tool === "arrow" ) {
        startPosition.current = { x, y };
        setIsDrawing(true);
        return;
    }

    const context = canvas.getContext("2d");

    context.beginPath();
    context.moveTo(x, y);

    currentStroke.current = [
        { x: x, y: y }
    ];

        setIsDrawing(true);
}

    //stop drawing
    function stopDrawing(event) {
    if (!isDrawing) {
        return;
    }

    if (tool === "select") {
    resizeHandle.current = null;
    setIsDrawing(false);
    return;
}

    if (
        tool === "rectangle" ||
        tool === "circle" ||
        tool === "arrow"
    ) {
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        const rect = canvas.getBoundingClientRect();

        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const startX = startPosition.current.x;
        const startY = startPosition.current.y;

        context.strokeStyle = color;
        context.lineWidth = strokeWidth;

        // Draw rectangle
        if (tool === "rectangle") {
        const newShape = {
        type: "rectangle",
        x: startX,
        y: startY,
        width: x - startX,
        height: y - startY,
        color: color,
        strokeWidth: strokeWidth
    };

    setShapes(previousShapes => [
        ...previousShapes,
        newShape
    ]);

    context.strokeRect(
        startX,
        startY,
        x - startX,
        y - startY
    );
}

        // Draw circle
        else if (tool === "circle") {
    const radius = Math.sqrt(
        Math.pow(x - startX, 2) +
        Math.pow(y - startY, 2)
    );

    const newShape = {
        type: "circle",
        x: startX,
        y: startY,
        radius: radius,
        color: color,
        strokeWidth: strokeWidth
    };

    setShapes(previousShapes => [
        ...previousShapes,
        newShape
    ]);

    context.beginPath();

    context.arc(
        startX,
        startY,
        radius,
        0,
        2 * Math.PI
    );

    context.stroke();
}

        // Draw arrow
        else if (tool === "arrow") {
            const newShape = {
                type: "arrow",
                startX: startX,
                startY: startY,
                endX: x,
                endY: y,
                color: color,
                strokeWidth: strokeWidth
            };

             setShapes(previousShapes => [
                ...previousShapes,
                newShape
            ]);

            const angle = Math.atan2(
                y - startY,
                x - startX
            );

            const headLength = 12;

            context.beginPath();
            context.moveTo(startX, startY);
            context.lineTo(x, y);
            context.stroke();

            context.beginPath();

            context.moveTo(x, y);

            context.lineTo(
                x - headLength * Math.cos(angle - Math.PI / 6),
                y - headLength * Math.sin(angle - Math.PI / 6)
            );

            context.moveTo(x, y);

            context.lineTo(
                x - headLength * Math.cos(angle + Math.PI / 6),
                y - headLength * Math.sin(angle + Math.PI / 6)
            );

            context.stroke();
        }
    }

    else {
    const newShape = {
        type: "freehand",
        points: [...currentStroke.current],
        color: isErasing ? "white" : color,
        strokeWidth: strokeWidth
    };

    setShapes(previousShapes => [
        ...previousShapes,
        newShape
    ]);
}
    setIsDrawing(false);
    
}

//Undo function
function undo() {
    if (shapes.length === 0) {
        return;
    }

    const lastShape = shapes[shapes.length - 1];

    setRedoStack(previousRedoStack => [
        ...previousRedoStack,
        lastShape
    ]);

    setShapes(previousShapes =>
        previousShapes.slice(0, -1)
    );
}

//Redo function
function redo() {
    if (redoStack.length === 0) {
        return;
    }

    const lastUndoneShape = redoStack[redoStack.length - 1];

    setShapes(previousShapes => [
        ...previousShapes,
        lastUndoneShape
    ]);

    setRedoStack(previousRedoStack =>
        previousRedoStack.slice(0, -1)
    );
}

//clear Cnva function
    function clearCanvas() {
    setShapes([]);
    setRedoStack([]);
}

function selectMode(nextMode) {
    setTool(nextMode === "eraser" ? "draw" : nextMode);
    setIsErasing(nextMode === "eraser");
}

    //draw function
    function draw(event) {
    if (!isDrawing) {
        return;
    }

    if (tool === "pan") {
    const deltaX = event.clientX - panStart.current.x;
    const deltaY = event.clientY - panStart.current.y;

    setPan({
        x: panStart.current.panX + deltaX,
        y: panStart.current.panY + deltaY
    });

    return;
}

    if (resizeHandle.current !== null && isDrawing) {
        const rect = canvasRef.current.getBoundingClientRect();

        const x = (event.clientX - rect.left) / zoom;
        const y = (event.clientY - rect.top) / zoom;

        const deltaX = x - dragStart.current.x;
        const deltaY = y - dragStart.current.y;

            setShapes(previousShapes =>
                previousShapes.map((shape, index) => {
                    if (index !== selectedShapeIndex) {
                        return shape;
            }

            const updatedShape = { ...shape };

        if (resizeHandle.current === "circle") {
            const distance = Math.sqrt(
                Math.pow(x - shape.x, 2) +
                Math.pow(y - shape.y, 2)
        );

    updatedShape.radius = Math.max(5, distance);

    return updatedShape;
}

if (resizeHandle.current === "text" && shape.type === "text") {
    console.log("Resizing text:", deltaY);
    
    updatedShape.fontSize = Math.max(
        8,
        shape.fontSize + deltaY
    );

    return updatedShape;
}

if (resizeHandle.current === "top-middle") {
    updatedShape.y += deltaY;
    updatedShape.height -= deltaY;
}

else if (resizeHandle.current === "bottom-middle") {
    updatedShape.height += deltaY;
}

else if (resizeHandle.current === "left-middle") {
    updatedShape.x += deltaX;
    updatedShape.width -= deltaX;
}

else if (resizeHandle.current === "right-middle") {
    updatedShape.width += deltaX;
}

            if (resizeHandle.current === "top-left") {
                updatedShape.x += deltaX;
                updatedShape.y += deltaY;
                updatedShape.width -= deltaX;
                updatedShape.height -= deltaY;
            }

            else if (resizeHandle.current === "top-right") {
                updatedShape.y += deltaY;
                updatedShape.width += deltaX;
                updatedShape.height -= deltaY;
            }

            else if (resizeHandle.current === "bottom-left") {
                updatedShape.x += deltaX;
                updatedShape.width -= deltaX;
                updatedShape.height += deltaY;
            }

            else if (resizeHandle.current === "bottom-right") {
                updatedShape.width += deltaX;
                updatedShape.height += deltaY;
            }

            return updatedShape;
        })
    );

    dragStart.current = { x, y };
    return;
}

if (tool === "select" && isDrawing && selectedShapeIndex !== null) {
    const rect = canvasRef.current.getBoundingClientRect();

    const x = (event.clientX - rect.left) / zoom;
    const y = (event.clientY - rect.top) / zoom;

    const deltaX = x - dragStart.current.x;
    const deltaY = y - dragStart.current.y;

    setShapes(previousShapes =>
        previousShapes.map((shape, index) => {
            if (index !== selectedShapeIndex) {
                return shape;
            }

            if (shape.type === "rectangle" ||
                shape.type === "circle" ||
                shape.type === "text") {
                return {
                    ...shape,
                    x: shape.x + deltaX,
                    y: shape.y + deltaY
                };
            }

            if (shape.type === "arrow") {
                return {
                    ...shape,
                    startX: shape.startX + deltaX,
                    startY: shape.startY + deltaY,
                     endX: shape.endX + deltaX,
                    endY: shape.endY + deltaY
                };
            }

            if (shape.type === "freehand") {
                return {
                    ...shape,
                    points: shape.points.map(point => ({
                    x: point.x + deltaX,
                    y: point.y + deltaY
                }))
            };
        }

            return shape;
        })
    );

    dragStart.current = { x, y };
    return;
}

    if (tool === "rectangle" || tool === "circle" ||
    tool === "arrow") {
    return;
    }

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    const rect = canvas.getBoundingClientRect();

    context.lineWidth = strokeWidth;
    context.lineCap = "round";
    context.strokeStyle = isErasing ? "white" : color;

    const x = (event.clientX - rect.left) / zoom;
    const y = (event.clientY - rect.top) / zoom;

    currentStroke.current.push({ x, y });

    context.lineTo(x, y);

    context.stroke();
}

    return (
        <div className="whiteboard-container">
            <div className="whiteboard-toolbar">
                <details className="toolbar-group" name="whiteboard-controls">
                    <summary>
                        <span className="toolbar-label">Colours</span>
                    </summary>
                    <div className="toolbar-options">
                        <label className="toolbar-color-picker">
                            Custom
                            <input
                                type="color"
                                aria-label="Choose a custom drawing colour"
                                value={color}
                                onChange={event => setColor(event.target.value)}
                            />
                        </label>
                        <button className={color === "#000000" ? "active-tool" : ""} onClick={() => setColor("#000000")}>
                            Black
                        </button>
                        <button className={color === "#ff0000" ? "active-tool" : ""} onClick={() => setColor("#ff0000")}>
                            Red
                        </button>
                        <button className={color === "#0000ff" ? "active-tool" : ""} onClick={() => setColor("#0000ff")}>
                            Blue
                        </button>
                        <button className={color === "#008000" ? "active-tool" : ""} onClick={() => setColor("#008000")}>
                            Green
                        </button>
                    </div>
                </details>

                <details className="toolbar-group" name="whiteboard-controls">
                    <summary>
                        <span className="toolbar-label">Stroke Width</span>
                    </summary>
                    <div className="toolbar-options">
                        <button className={strokeWidth === 1 ? "active-tool" : ""} onClick={() => setStrokeWidth(1)}>
                            Thin
                        </button>
                        <button className={strokeWidth === 3 ? "active-tool" : ""} onClick={() => setStrokeWidth(3)}>
                            Medium
                        </button>
                        <button className={strokeWidth === 8 ? "active-tool" : ""} onClick={() => setStrokeWidth(8)}>
                            Thick
                        </button>
                    </div>
                </details>

                <details className="toolbar-group" name="whiteboard-controls">
                    <summary>
                        <span className="toolbar-label">Mode</span>
                    </summary>
                    <div className="toolbar-options">
                        <button
                            className={tool === "draw" && !isErasing ? "active-tool" : ""}
                            onClick={() => selectMode("draw")}
                        >
                            Freehand
                        </button>
                        <button
                            className={tool === "rectangle" ? "active-tool" : ""}
                            onClick={() => selectMode("rectangle")}
                        >
                            Rectangle
                        </button>
                        <button
                            className={tool === "circle" ? "active-tool" : ""}
                            onClick={() => selectMode("circle")}
                        >
                            Circle
                        </button>
                        <button
                            className={tool === "arrow" ? "active-tool" : ""}
                            onClick={() => selectMode("arrow")}
                        >
                            Arrow
                        </button>
                        <button
                            className={tool === "text" ? "active-tool" : ""}
                            onClick={() => selectMode("text")}
                        >
                            Text
                        </button>
                        <button
                            className={tool === "pan" ? "active-tool" : ""}
                            onClick={() => selectMode("pan")}
                        >
                            Pan
                        </button>
                        <button
                            className={tool === "select" ? "active-tool" : ""}
                            onClick={() => selectMode("select")}
                        >
                            Select
                        </button>
                    </div>
                </details>

                <details className="toolbar-group" name="whiteboard-controls">
                    <summary>
                        <span className="toolbar-label">Actions</span>
                    </summary>
                    <div className="toolbar-options">
                        <button
                            className={tool === "draw" && isErasing ? "active-tool" : ""}
                            onClick={() => selectMode(tool === "draw" && isErasing ? "draw" : "eraser")}
                        >
                            Eraser
                        </button>
                        <button onClick={undo}>Undo</button>
                        <button onClick={redo}>Redo</button>
                        <button onClick={clearCanvas}>Clear Canvas</button>
                        <button onClick={() => {
                            if (selectedShapeIndex === null) {
                                return;
                            }

                            setShapes(previousShapes =>
                                previousShapes.filter(
                                    (shape, index) => index !== selectedShapeIndex
                                )
                            );

                            setSelectedShapeIndex(null);
                        }}>
                            Delete Selected
                        </button>
                    </div>
                </details>

                <details className="toolbar-group" name="whiteboard-controls">
                    <summary>
                        <span className="toolbar-label">Zoom</span>
                    </summary>
                    <div className="toolbar-options">
                        <button onClick={() => setZoom(Math.min(2, zoom + 0.1))}>
                            Zoom In +
                        </button>
                        <button onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}>
                            Zoom Out -
                        </button>
                    </div>
                </details>

            </div>

            {tool === "text" && (
                <input
                    className="whiteboard-text-input"  
                    type="text"
                    value={textInput}
                    onChange={event => setTextInput(event.target.value)}
                    placeholder="Enter text to add to the whiteboard"
                />
            )}

            <div className="whiteboard-canvas-header">
                <h3>Collaborative Whiteboard</h3>

            <p>
                Selected shape:{" "}
                {selectedShapeIndex !== null
                    ? shapes[selectedShapeIndex]?.type
                    : "None"}
                 </p>
            </div>


            <div className="whiteboard-canvas-wrapper">
            <canvas
                ref={canvasRef}
                width="800"
                height="500"
                style={{
                    border: "2px solid black",
                    backgroundColor: "white",
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: "top left"
                }}

                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
            >
            </canvas>
            
        </div>
       </div>
    );
}   

export default Whiteboard;