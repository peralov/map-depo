const {
  createDepo,
  getAllDepos,
  getDepoById,
  updateDepo
} = require('../models/depo');

const VALID_STATUSES = ['clean', 'low', 'medium', 'high'];
const VALID_TYPES = [
  'garbage',
  'debris',
  'landfill',
  'electronic',
  'hazardous',
  'construction',
  'organic',
  'plastic',
  'other'
];
const VALID_SIZES = ['small', 'medium', 'large'];

const parseCoordinate = (coordinateInput, minimum, maximum) => {
  const coordinate = Number(coordinateInput);
  const isInRange =
    Number.isFinite(coordinate) &&
    coordinate >= minimum &&
    coordinate <= maximum;
  return isInRange ? coordinate : null;
};

const coordinatesAreMissing = ({ latitude, longitude }) => {
  return [latitude, longitude].some(
    (coordinate) =>
      coordinate === undefined || coordinate === null || coordinate === ''
  );
};

const classificationError = ({ status, type, size }) => {
  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return 'Invalid status value';
  }
  if (type !== undefined && !VALID_TYPES.includes(type)) {
    return 'Invalid type value';
  }
  if (size !== undefined && !VALID_SIZES.includes(size)) {
    return 'Invalid size value';
  }
  return null;
};

const newSiteRequest = (requestBody, userId) => ({
  name: typeof requestBody.name === 'string' ? requestBody.name.trim() : '',
  description: requestBody.description,
  latitude: parseCoordinate(requestBody.latitude, -90, 90),
  longitude: parseCoordinate(requestBody.longitude, -180, 180),
  status: requestBody.status || 'medium',
  type: requestBody.type || 'garbage',
  size: requestBody.size || 'medium',
  userId
});

const newSiteValidationError = (requestBody, siteRequest) => {
  if (!siteRequest.name || coordinatesAreMissing(requestBody)) {
    return 'Name, latitude, and longitude are required';
  }
  if (siteRequest.latitude === null || siteRequest.longitude === null) {
    return 'Latitude must be between -90 and 90 and longitude between -180 and 180';
  }
  return classificationError(siteRequest);
};

const siteUpdateValidationError = (requestBody) => {
  if (
    requestBody.name !== undefined &&
    (typeof requestBody.name !== 'string' || !requestBody.name.trim())
  ) {
    return 'Name cannot be empty';
  }
  return classificationError(requestBody);
};

const siteUpdates = ({ name, description, status, type, size }) => {
  const updates = {};
  if (name !== undefined) updates.name = name.trim();
  if (description !== undefined) updates.description = description;
  if (status !== undefined) updates.status = status;
  if (type !== undefined) updates.type = type;
  if (size !== undefined) updates.size = size;
  return updates;
};

const getDepos = async (req, res) => {
  try {
    res.json(await getAllDepos());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getDepo = async (req, res) => {
  try {
    const depo = await getDepoById(req.params.id);
    if (!depo) {
      return res.status(404).json({ error: 'Waste site not found' });
    }
    res.json(depo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const addDepo = async (req, res) => {
  try {
    const siteRequest = newSiteRequest(req.body, req.user.id);
    const validationError = newSiteValidationError(req.body, siteRequest);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const depo = await createDepo(siteRequest);
    res.status(201).json(depo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const editDepo = async (req, res) => {
  try {
    const depo = await getDepoById(req.params.id);
    if (!depo) {
      return res.status(404).json({ error: 'Waste site not found' });
    }
    if (depo.reportedBy?.id !== req.user.id) {
      return res
        .status(403)
        .json({ error: 'Not authorized to update this waste site' });
    }

    const validationError = siteUpdateValidationError(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const updates = siteUpdates(req.body);
    if (!Object.keys(updates).length) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    res.json(await updateDepo(req.params.id, updates));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  addDepo,
  editDepo,
  getDepo,
  getDepos
};
