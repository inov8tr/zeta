type StructuredDataProps = {
  data: Record<string, unknown>;
};

const StructuredData = ({ data }: StructuredDataProps) => {
  if (!data || Object.keys(data).length === 0) {
    return null;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
};

export default StructuredData;
