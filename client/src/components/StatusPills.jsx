import { Group, Badge, ActionIcon, Tooltip } from '@mantine/core';
import { IconX } from '@tabler/icons-react';

export default function StatusPills({ status, interactive = false, onStatusChange, onRemove }) {
  const getVariant = (matchStatus) => status === matchStatus ? 'filled' : 'outline';
  const getColor = (matchStatus) => status === matchStatus ? 'terracotta' : 'line';
  const getTextColor = (matchStatus) => status === matchStatus ? 'white' : 'muted';
  const getFw = (matchStatus) => status === matchStatus ? 600 : 500;

  const handleClick = (newStatus) => {
    if (interactive && onStatusChange) {
      onStatusChange(newStatus);
    }
  };

  return (
    <Group gap="xs">
      <Badge 
        color={getColor('want')} 
        variant={getVariant('want')} 
        c={getTextColor('want')} 
        radius="xl" 
        size="lg" 
        style={{ fontWeight: getFw('want'), textTransform: 'none', cursor: interactive ? 'pointer' : 'default' }}
        onClick={() => handleClick('want')}
      >
        Want
      </Badge>
      <Badge 
        color={getColor('reading')} 
        variant={getVariant('reading')} 
        c={getTextColor('reading')} 
        radius="xl" 
        size="lg" 
        style={{ fontWeight: getFw('reading'), textTransform: 'none', cursor: interactive ? 'pointer' : 'default' }}
        onClick={() => handleClick('reading')}
      >
        Reading
      </Badge>
      <Badge 
        color={getColor('finished')} 
        variant={getVariant('finished')} 
        c={getTextColor('finished')} 
        radius="xl" 
        size="lg" 
        style={{ fontWeight: getFw('finished'), textTransform: 'none', cursor: interactive ? 'pointer' : 'default' }}
        onClick={() => handleClick('finished')}
      >
        Finished
      </Badge>
      {interactive && onRemove && (
        <Tooltip label="Remove from list">
          <ActionIcon 
            variant="subtle" 
            color="red" 
            radius="xl"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
          >
            <IconX size={18} stroke={2.5} />
          </ActionIcon>
        </Tooltip>
      )}
    </Group>
  );
}
